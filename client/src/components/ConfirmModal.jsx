import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning' // warning, danger
}) {
  const colors = {
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700'
    }
  };

  const color = colors[type] || colors.warning;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className={`${color.bg} p-6 border-b border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className={`text-2xl ${color.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-6 py-2.5 rounded-lg ${color.button} text-white font-semibold transition shadow-lg`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
