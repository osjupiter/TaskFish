import React, { useRef, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const DraggableWindow = ({ children }: { children: React.ReactNode }) => {
    const dragAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dragArea = dragAreaRef.current;
        if (!dragArea) return;
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            getCurrentWindow().startDragging();
        };
        dragArea.addEventListener('mousedown', handleMouseDown);
        return () => {
            dragArea.removeEventListener('mousedown', handleMouseDown);
        }
    }, [])

    return (
        <div ref={dragAreaRef} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
            {children}
        </div>
    );
};

export default DraggableWindow;