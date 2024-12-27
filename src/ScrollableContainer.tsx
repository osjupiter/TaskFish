// ScrollableContainer.tsx
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css'; // スタイルシートをインポート

interface ScrollableContainerProps {
    children: React.ReactNode;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({ children }) => {
    return (
        <SimpleBar
            className="relative group custom-scrollbar"
            style={{ height: 'calc(100vh - 15rem)', overflowY: 'auto' }}
        >
            {children}
        </SimpleBar>
    );
};

export default ScrollableContainer;