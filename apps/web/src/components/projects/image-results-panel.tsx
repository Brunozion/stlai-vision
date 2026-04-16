import Image from "next/image";
import type { ImageResult } from "@/lib/api/projects";

export function ImageResultsPanel({ items }: { items: ImageResult[] }) {
  if (items.length === 0) {
    return <p className="muted-text">Nenhuma imagem gerada ainda.</p>;
  }

  return (
    <div className="image-grid">
      {items.map((image) => (
        <article className="image-card" key={image.id}>
          <div className="image-frame">
            <Image
              alt={image.title ?? image.imageKind}
              fill
              sizes="(max-width: 860px) 100vw, 33vw"
              src={image.fileUrl}
              unoptimized
            />
          </div>
          <div className="image-card__body">
            <strong>{image.title ?? image.imageKind}</strong>
            <p>{image.provider ?? "sem provider"}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
