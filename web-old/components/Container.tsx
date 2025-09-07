import React from 'react';

type ContainerProps = React.PropsWithChildren<{ className?: string }>;

export default function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={['mx-auto w-full max-w-[1440px] px-4 sm:px-4 md:px-8 lg:px-8 xl:px-10', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
