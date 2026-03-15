import { useState, useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/lessn/Avatar';
import { STATUS_LABELS } from '@/constants';
import { formatDate, formatTime, todayStr } from '@/utils/helpers';
import { Modal } from '@/components/lessn/Modal';

const TIME_SLOTS = ['8:00', '9:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

export default function Schedule() {
  const { students, lessons, addLesson, updateLesson, deleteLesson } = useAppData();
  const { teacher } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modal, setModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; timeSlot: number } | null>(null);
  const [formStudentId, setFormStudentId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDuration, setFormDuration] = useState(60);

  // Calculate week dates
  const getWeekMonday = () => {
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + currentWeek * 7);
    return monday;
  };

  const weekDates = useMemo(() => {
    const monday = getWeekMonday();
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentWeek]);

  // Map lessons to grid
  const scheduleLessons = useMemo(() => {
    const monday = getWeekMonday();
    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return lessons
      .filter((l) => !l.is_group && l.date >= weekStart && l.date <= weekEndStr)
      .map((l) => {
        const lessonDate = new Date(l.date);
        const dayOfWeek = lessonDate.getDay() === 0 ? 6 : lessonDate.getDay() - 1;
        let timeSlot = 0;
        if (l.time) {
          const hours = parseInt(l.time.split(':')[0]);
          timeSlot = TIME_SLOTS.findIndex((t) => parseInt(t.split(':')[0]) === hours);
          if (timeSlot === -1) timeSlot = 0;
        }
        const student = students.find((s) => s.id === l.student_id);
        const isToday = l.date === todayStr();
        return {
          id: l.id,
          day: dayOfWeek,
          timeSlot,
          studentName: student?.name || 'Невідомий',
          status: l.status,
          duration: l.duration,
          notes: l.notes,
          isToday,
        };
      });
  }, [lessons, students, currentWeek]);

  const handleCellClick = (day: number, timeSlot: number) => {
    setSelectedCell({ day, timeSlot });
    setFormStudentId(students[0]?.id || '');
    setFormNotes('');
    setFormDuration(60);
    setModal(true);
  };

  const handleAddLesson = async () => {
    if (!selectedCell || !formStudentId || !teacher) return;
    const date = weekDates[selectedCell.day].toISOString().split('T')[0];
    const hours = parseInt(TIME_SLOTS[selectedCell.timeSlot].split(':')[0]);
    const time = `${hours.toString().padStart(2, '0')}:00`;

    await addLesson.mutateAsync({
      student_id: formStudentId,
      group_id: null,
      is_group: false,
      date,
      time,
      duration: formDuration,
      notes: formNotes,
      status: 'scheduled',
      teacher_id: teacher.id,
    });
    setModal(false);
  };

  const todayDate = new Date();
  const currentDayIndex = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1;
  const isCurrentWeek = currentWeek === 0;

  // List view data
  const allLessonsListView = useMemo(() => {
    return lessons
      .filter((l) => !l.is_group)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''));
  }, [lessons]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">Розклад</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {viewMode === 'grid' ? 'Інтерактивний тижневий розклад занять' : `${allLessonsListView.length} уроків загалом`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-secondary rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-[13px] font-semibold transition-all ${viewMode === 'grid' ? 'bg-foreground text-card' : 'text-muted-foreground'}`}
            >
              Сітка
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-[13px] font-semibold transition-all ${viewMode === 'list' ? 'bg-foreground text-card' : 'text-muted-foreground'}`}
            >
              Список
            </button>
          </div>

          {viewMode === 'grid' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentWeek(currentWeek - 1)} className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-border transition-all">&lt;</button>
              <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-center">
                Тиждень {currentWeek >= 0 ? '+' : ''}{currentWeek}
              </span>
              <button onClick={() => setCurrentWeek(currentWeek + 1)} className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-border transition-all">&gt;</button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="bg-card rounded-lg border border-border overflow-x-auto shadow-sm">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="px-3 py-3 text-xs font-semibold text-muted-foreground w-16"></th>
                {DAYS.map((day, index) => {
                  const isToday = isCurrentWeek && index === currentDayIndex;
                  return (
                    <th key={day} className={`px-2 py-3 text-center ${isToday ? 'bg-mint-50' : ''}`}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{day}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-mint-dark' : 'text-foreground'}`}>
                        {weekDates[index].getDate()}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time, timeIndex) => (
                <tr key={time} className="border-t border-border">
                  <td className="px-3 py-2 text-[11px] font-medium text-muted-foreground align-top">{time}</td>
                  {DAYS.map((_, dayIndex) => {
                    const lesson = scheduleLessons.find((l) => l.day === dayIndex && l.timeSlot === timeIndex);
                    const isToday = isCurrentWeek && dayIndex === currentDayIndex;
                    return (
                      <td
                        key={dayIndex}
                        className={`px-1 py-1 border-l border-border min-h-[60px] ${
                          isToday ? 'bg-mint-50/30' : timeIndex % 2 === 0 ? 'bg-transparent' : 'bg-secondary/20'
                        } ${!lesson ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                        onClick={() => !lesson && handleCellClick(dayIndex, timeIndex)}
                      >
                        {lesson && (
                          <div className={`rounded-md px-2 py-1.5 text-xs ${
                            lesson.status === 'completed' ? 'bg-mint-dark text-white' :
                            lesson.status === 'cancelled' ? 'bg-coral-light text-coral-dark' :
                            lesson.isToday ? 'bg-mint-dark/80 text-white' :
                            'bg-foreground text-white'
                          }`}>
                            <p className="font-semibold truncate">{lesson.studentName}</p>
                            <p className="opacity-75">{lesson.duration} хв</p>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* List View */
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {allLessonsListView.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Немає занять</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Дата</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Учень</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Час</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Статус</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Дії</th>
                </tr>
              </thead>
              <tbody>
                {allLessonsListView.map((l) => {
                  const student = students.find((s) => s.id === l.student_id);
                  return (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">{formatDate(l.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={student?.name || '?'} size={24} />
                          <span className="text-sm text-foreground">{student?.name || 'Невідомий'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{formatTime(l.time)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          l.status === 'completed' ? 'bg-mint-light text-foreground' :
                          l.status === 'cancelled' ? 'bg-coral-light text-coral-dark' :
                          'bg-secondary text-foreground'
                        }`}>
                          {STATUS_LABELS[l.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.status === 'scheduled' && (
                          <button
                            onClick={() => updateLesson.mutate({ id: l.id, status: 'completed' })}
                            className="text-xs px-2 py-1 bg-mint-light text-foreground rounded font-medium hover:bg-mint/30 transition-all"
                          >
                            Готово
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Нове заняття"
        footer={<>
          <button onClick={() => setModal(false)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">Скасувати</button>
          <button onClick={handleAddLesson} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all">Додати</button>
        </>}
      >
        <div className="space-y-4">
          {selectedCell && (
            <div className="bg-mint-50 rounded-md p-3 text-sm text-foreground">
              {DAYS[selectedCell.day]}, {TIME_SLOTS[selectedCell.timeSlot]}
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Учень</label>
            <select className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={formStudentId} onChange={(e) => setFormStudentId(e.target.value)}>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.name} - {s.subject}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Тривалість</label>
            <select className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))}>
              <option value={30}>30 хв</option>
              <option value={45}>45 хв</option>
              <option value={60}>60 хв</option>
              <option value={90}>90 хв</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Нотатки</label>
            <input className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Необов'язково" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
