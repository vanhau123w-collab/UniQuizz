import { useState } from "react";
import { motion } from "framer-motion";

export default function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-3 rounded-lg transition-colors" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-lg leading-snug max-w-[90%]">
          {question}
        </h4>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-gray-600 dark:text-gray-400 text-xl select-none"
        >
          ▼
        </motion.span>
      </div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-base leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}
