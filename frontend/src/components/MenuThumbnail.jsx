import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { getMenuImageCandidates } from '../utils/menuImages';

export default function MenuThumbnail({ menu, categories = [], iconClassName = 'w-8 h-8 text-slate-400' }) {
  const candidates = getMenuImageCandidates(menu, categories);
  const signature = candidates.join('|');

  // Simpan percobaan gambar yang gagal beserta signature kandidatnya, sehingga
  // fallback otomatis kembali ke kandidat pertama ketika data menu berubah.
  const [failure, setFailure] = useState({ signature: '', index: 0 });
  const index = failure.signature === signature ? failure.index : 0;
  const imageSrc = candidates[index] || null;

  if (!imageSrc) {
    return <Coffee className={iconClassName} />;
  }

  return (
    <img
      key={imageSrc}
      src={imageSrc}
      alt={menu.name}
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => setFailure({ signature, index: index + 1 })}
    />
  );
}
