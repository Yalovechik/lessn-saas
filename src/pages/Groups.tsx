import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/helpers";
import { Avatar } from "@/components/lessn/Avatar";
import { EmptyState } from "@/components/lessn/EmptyState";
import { Modal } from "@/components/lessn/Modal";
import { Plus } from "lucide-react";

export default function Groups() {
    const { students, groups, lessons, addGroup, updateGroup, deleteGroup } =
        useAppData();
    const { teacher } = useAuth();
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        studentIds: [] as string[],
        pricePerStudent: "",
    });

    const openNew = () => {
        setForm({ name: "", studentIds: [], pricePerStudent: "" });
        setEditId(null);
        setModal(true);
    };

    const openEdit = (g: (typeof groups)[0]) => {
        setForm({
            name: g.name,
            studentIds: g.student_ids || [],
            pricePerStudent: String(g.price_per_student),
        });
        setEditId(g.id);
        setModal(true);
    };

    const save = async () => {
        if (!form.name.trim() || !form.pricePerStudent || !teacher) return;
        try {
            if (editId) {
                await updateGroup.mutateAsync({
                    id: editId,
                    name: form.name,
                    subject: teacher.subject,
                    price_per_student: Number(form.pricePerStudent),
                    studentIds: form.studentIds,
                });
            } else {
                await addGroup.mutateAsync({
                    name: form.name,
                    subject: teacher.subject,
                    price_per_student: Number(form.pricePerStudent),
                    teacher_id: teacher.id,
                    studentIds: form.studentIds,
                });
            }
            setModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const remove = async (id: string) => {
        await deleteGroup.mutateAsync(id);
        setDeleteConfirmId(null);
    };

    const toggleStudent = (studentId: string) => {
        setForm((prev) => ({
            ...prev,
            studentIds: prev.studentIds.includes(studentId)
                ? prev.studentIds.filter((id) => id !== studentId)
                : [...prev.studentIds, studentId],
        }));
    };

    const groupStats = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return { totalLessons: 0, completed: 0 };
        const gLessons = lessons.filter(
            (l) => l.is_group && l.group_id === groupId,
        );
        return {
            totalLessons: gLessons.length,
            completed: gLessons.filter((l) => l.status === "completed").length,
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
                        Групи
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {groups.length} груп створено
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold transition-all hover:bg-mint-dark"
                >
                    <Plus className="h-4 w-4" />
                    Створити групу
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="bg-card rounded-lg border border-border">
                    <EmptyState
                        icon="👥"
                        title="Груп ще немає"
                        desc="Створіть першу групу для спільних занять"
                        action={
                            <button
                                onClick={openNew}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                            >
                                Створити групу
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => {
                        const stats = groupStats(group.id);
                        const isDraft = (group.student_ids?.length || 0) < 2;
                        return (
                            <div
                                key={group.id}
                                className={`bg-card rounded-lg border p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer ${
                                    isDraft
                                        ? "border-border border-dashed"
                                        : "border-border hover:border-primary"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            {group.name}
                                        </h3>
                                        {isDraft && (
                                            <span className="text-[10px] font-semibold text-orange-dark bg-orange-light px-2 py-0.5 rounded-full mt-1 inline-block">
                                                Чернетка
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className="flex gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => openEdit(group)}
                                            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() =>
                                                setDeleteConfirmId(group.id)
                                            }
                                            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-coral hover:text-coral-dark hover:bg-coral-light transition-all"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mb-3">
                                    {group.student_ids?.length || 0} учнів •{" "}
                                    {formatCurrency(group.price_per_student)}
                                    /учень
                                </p>

                                {/* Student avatars */}
                                {(group.student_ids?.length || 0) > 0 ? (
                                    <div className="flex -space-x-2 mb-3">
                                        {(group.student_ids || [])
                                            .slice(0, 4)
                                            .map((sid) => {
                                                const student = students.find(
                                                    (s) => s.id === sid,
                                                );
                                                return student ? (
                                                    <Avatar
                                                        key={sid}
                                                        name={student.name}
                                                        size={28}
                                                    />
                                                ) : null;
                                            })}
                                        {(group.student_ids?.length || 0) >
                                            4 && (
                                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                +
                                                {(group.student_ids?.length ||
                                                    0) - 4}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground/50 mb-3">
                                        Група порожня
                                    </p>
                                )}

                                {!isDraft && (
                                    <div className="flex gap-4 text-center pt-3 border-t border-border">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Уроків
                                            </p>
                                            <p className="text-sm font-bold text-foreground">
                                                {stats.totalLessons}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Проведено
                                            </p>
                                            <p className="text-sm font-bold text-foreground">
                                                {stats.completed}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Дохід
                                            </p>
                                            <p className="text-sm font-bold text-foreground">
                                                {formatCurrency(
                                                    stats.completed *
                                                        group.price_per_student *
                                                        (group.student_ids
                                                            ?.length || 0),
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal
                open={modal}
                onClose={() => setModal(false)}
                title={editId ? "Редагувати групу" : "Нова група"}
                footer={
                    <>
                        <button
                            onClick={() => setModal(false)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={save}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                        >
                            {editId ? "Оновити" : "Створити"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Назва групи
                        </label>
                        <input
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Ціна за учня (грн)
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            value={form.pricePerStudent}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    pricePerStudent: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Учні в групі ({form.studentIds.length} обрано)
                        </label>
                        {students.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Немає доступних учнів
                            </p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {students.map((student) => {
                                    const isSelected = form.studentIds.includes(
                                        student.id,
                                    );
                                    return (
                                        <button
                                            key={student.id}
                                            onClick={() =>
                                                toggleStudent(student.id)
                                            }
                                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all ${
                                                isSelected
                                                    ? "bg-mint-50 border-[1.5px] border-foreground"
                                                    : "border-[1.5px] border-transparent hover:bg-secondary/30"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="cursor-pointer"
                                            />
                                            <Avatar
                                                name={student.name}
                                                size={24}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {student.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {student.subject}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Delete confirm */}
            <Modal
                open={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Видалити групу?"
                footer={
                    <>
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={() =>
                                deleteConfirmId && remove(deleteConfirmId)
                            }
                            className="px-4 py-2 rounded-md bg-coral-light text-coral-dark text-sm font-semibold"
                        >
                            Видалити
                        </button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити групу? Усі уроки цієї групи
                    також будуть видалені.
                </p>
            </Modal>
        </div>
    );
}
