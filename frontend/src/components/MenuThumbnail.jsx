import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { getMenuImage } from '../utils/menuImages';

export default function MenuThumbnail({ menu, categories = [], iconClassName = 'w-8 h-8 text-slate-400' }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = getMenuImage(menu, categories);

  if (!imageSrc || failed) {
    return <Coffee className={iconClassName} />;
  }

  return (
    <img
      src={imageSrc}
      alt={menu.name}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
