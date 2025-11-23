
import { motion } from 'motion/react';
import { ReactNode } from 'react';

/**
 * 页面切换过渡动画组件
 * 模拟 Vue 的 <Transition> 上浮淡入效果
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
