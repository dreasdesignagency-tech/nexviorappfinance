import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const BlurText = ({ text, className, delay = 0 }: BlurTextProps) => {
  const words = text.split(" ");
  return (
    <span className={cn("inline-flex flex-wrap gap-x-[0.3em] gap-y-2", className)}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(12px)", y: 12 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          className="inline-block"
          dangerouslySetInnerHTML={{ __html: w }}
        />
      ))}
    </span>
  );
};
