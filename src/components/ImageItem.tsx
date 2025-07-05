import React from 'react';

interface ImageItemProps {
  item: { id: string; url: string };
  index: number;
  openModal: (index: number) => void;
}

const ImageItem: React.FC<ImageItemProps> = React.memo(({ item, index, openModal }) => {
  console.log("Rendering ImageItem with ID:", item.id); // Add this line
  return (
    <img
      src={item.url}
      alt={`Image ${index}`}
      style={{
        width: "100%",
        height: "auto",
        cursor: "pointer",
      }}
      onClick={() => openModal(index)}
    />
  );
});

export default ImageItem;