import Image from "next/image";
import type { QuizImageRef } from "@/lib/quiz-image";

// 問題の図。問題文の下に並べる
export function QuizImages({ images }: { images: QuizImageRef[] }) {
  if (images.length === 0) return null;
  return (
    <div className="space-y-3">
      {images.map((image, index) => (
        <Image
          key={image.id}
          src={`/api/quiz-images/${image.id}`}
          width={image.width}
          height={image.height}
          alt={images.length > 1 ? `問題の図 ${index + 1}/${images.length}` : "問題の図"}
          unoptimized
          className="max-w-full h-auto rounded-md border bg-white"
        />
      ))}
    </div>
  );
}
