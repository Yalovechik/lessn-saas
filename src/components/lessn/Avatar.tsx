import { avatarColor } from '@/utils/helpers';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 36 }: AvatarProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: avatarColor(name || '?'),
        color: '#fff',
        fontSize: size * 0.38,
      }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}
