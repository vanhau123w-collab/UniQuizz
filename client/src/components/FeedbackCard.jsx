import React from 'react';
import { motion } from 'framer-motion';

const FeedbackCard = ({ quote, name, role, bgColor }) => (
    <motion.div 
        className="group relative w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 dark:hover:shadow-red-900/30"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
    >
        {/* Decorative gradient on hover */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        
        {/* Quote Icon */}
        <div className="absolute top-6 right-6 opacity-10 dark:opacity-5 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-300">
            <svg className="w-16 h-16 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
        </div>
        
        {/* Quote */}
        <p className="relative z-10 text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-8 grow">
            <span className="text-red-600 dark:text-red-400 font-bold text-xl">"</span>
            {quote}
            <span className="text-red-600 dark:text-red-400 font-bold text-xl">"</span>
        </p>

        {/* Author Info - Centered Layout */}
        <div className="relative z-10 flex flex-col items-center mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
            {/* Avatar with gradient ring */}
            <div className="relative mb-3 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div
                    className={`relative w-14 h-14 ${bgColor} dark:opacity-80 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800 group-hover:ring-red-100 dark:group-hover:ring-red-900/50 transition-all duration-300`}
                >
                    <img
                        src="/avatar-placeholder.jpg"
                        alt={`Avatar của ${name}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </div>
            </div>

            {/* Name + Role - Centered */}
            <div className="text-center">
                <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                    {name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {role}
                </p>
                
                {/* Star Rating - Centered below role */}
                <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

export default FeedbackCard;
