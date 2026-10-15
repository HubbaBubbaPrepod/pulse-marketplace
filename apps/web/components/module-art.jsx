import Image from 'next/image';
import { Icon } from './icon';
export function ModuleArt({ id, large = false, priority = false }) {
  const known = ['docker', 'postgresql', 'nginx', 'redis', 'systemd', 'backup'].includes(id);
  return (
    <div className={`module-art ${large ? 'module-art-large' : ''}`}>
      {known ? (
        <Image
          src={`/assets/modules/${id}.png`}
          width={1254}
          height={1254}
          sizes={large ? '(max-width: 600px) 130px, 210px' : '150px'}
          alt=""
          priority={priority}
        />
      ) : (
        <Icon name="box" size={large ? 110 : 74} />
      )}
    </div>
  );
}
