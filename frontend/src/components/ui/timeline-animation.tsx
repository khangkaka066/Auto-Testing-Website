"use client";

import {
  ElementType,
  ReactNode,
  RefObject,
  useMemo,
} from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimationVariants = {
  visible: (i: number) => object;
  hidden: object;
};

interface TimelineContentProps {
  as?: ElementType;
  animationNum: number;
  timelineRef: RefObject<HTMLElement | null>;
  customVariants?: AnimationVariants;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

const defaultVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export function TimelineContent({
  as: Tag = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}: TimelineContentProps) {
  const isInView = useInView(timelineRef as RefObject<Element>, {
    once: true,
    margin: "-5% 0px",
  });

  // Memoize so framer-motion doesn't see a new component type on every render
  const MotionTag = useMemo(() => motion(Tag as ElementType), [Tag]);
  const variants = customVariants || defaultVariants;

  return (
    <MotionTag
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants as any}
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </MotionTag>
  );
}
