interface MovieSynopsisProps {
  description: string;
}

export default function MovieSynopsis({ description }: MovieSynopsisProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </section>
  );
}
