import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* FIX: Changed inset-0 to explicit fixed viewport coordinates (top-0 left-0 w-screen h-screen) 
            with a higher z-index array class to guarantee it completely locks the entire device display.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/60 backdrop-blur-md"
          />
          
          {/* ELEVATED the modal content card box to z-[10000] so it sits securely 
            on top of our newly reinforced dark blur overlay layer.
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-[50%] top-[50%] z-[10000] w-[calc(100%-2rem)] sm:w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-white p-5 sm:p-6 shadow-xl dark:bg-gray-900 dark:border-gray-800 max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold pr-4 truncate text-gray-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scrollable Container Body */}
            <div className="overflow-y-auto flex-1 pr-1 -mr-1 [scrollbar-width:thin]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}