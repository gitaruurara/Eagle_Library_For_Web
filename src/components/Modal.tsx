import React, { useEffect, useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

interface ModalProps {
  images: { id: string; url: string }[];
  selectedImageIndex: number;
  onClose: () => void;
}

interface EagleImageInfo {
  id: string;
  name: string;
  size: number;
  ext: string;
  tags: string[];
  folders: string[];
  width: number;
  height: number;
  url: string;
  annotation: string;
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContentWrapper: {
    position: "relative",
    maxWidth: "95%", // カルーセルの最大幅を調整
    maxHeight: "95vh", // カルーセルの最大高さを調整
    display: "flex", // flexに戻す
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "auto",
  },
  carouselContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // カルーセルを情報パネルより奥に配置
  },
  image: {
    objectFit: "contain",
    maxHeight: "90vh",
    maxWidth: "100%",
  },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: "30px",
    zIndex: 1003,
  },
  infoPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "320px",
    backgroundColor: "rgba(25, 25, 25, 0.9)",
    color: "#f1f1f1",
    padding: "20px",
    overflowY: "auto",
    borderRadius: "8px",
    borderRight: "none",
    zIndex: 2, // カルーセルより手前に配置
    transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
  },
toggleInfoButton: {
  position: "absolute",
  top: "50px", // ボタンを画像の少し上に配置
  left: "15px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  border: "1px solid #888",
  borderRadius: "4px",
  padding: "8px 12px",
  cursor: "pointer",
  zIndex: 1002, // overlayの背景より手前に
},
  navArrow: { // 左右送りボタンは削除
    background: "rgba(0,0,0,0)",
    color: "white",
    border: "none",
    padding: "10px 0",
    cursor: "pointer",
    fontSize: "24px",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001,
  },
  infoItem: { marginBottom: '12px' },
  infoTitle: { fontWeight: 'bold', color: '#9e9e9e', fontSize: '0.9em', marginBottom: '4px' },
  infoContent: { fontSize: '1em', wordWrap: 'break-word' },
  tag: { display: 'inline-block', backgroundColor: '#007acc', color: 'white', padding: '2px 8px', borderRadius: '4px', marginRight: '5px', marginBottom: '5px', fontSize: '0.9em' },
};

const Modal: React.FC<ModalProps> = ({ images, selectedImageIndex, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(selectedImageIndex);
  const [imageInfo, setImageInfo] = useState<EagleImageInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImageIndex < images.length) {
      setCurrentSlideIndex(selectedImageIndex);
    } else {
      setCurrentSlideIndex(images.length - 1);
    }
  }, [images.length, selectedImageIndex]);

  // 画像情報取得のuseEffect
  useEffect(() => {
    if (images.length === 0) return;
    setLoadingInfo(true);
    const imageId = images[currentSlideIndex].id;
    fetch(`/eagle/api/item/info/${imageId}`)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        return response.json();
      })
      .then((data: EagleImageInfo) => setImageInfo(data))
      .catch(err => {
        console.error("Error fetching image info:", err);
        setImageInfo(null);
        setError("画像情報の取得に失敗しました。");
      })
      .finally(() => setLoadingInfo(false));
  }, [currentSlideIndex, images]);

  // エラーハンドリングのuseEffect (既存)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Unhandled error in Modal:", event.error);
      setError(event.message || "An unknown error occurred in the modal.");
      event.preventDefault();
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const toggleInfoPanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInfoVisible(prev => !prev);
  };

  // handlePrevとhandleNextはCarouselが処理するため不要

  const infoPanelStyle: React.CSSProperties = {
    ...styles.infoPanel,
    transform: isInfoVisible ? 'translateX(0)' : 'translateX(-100%)',
    opacity: isInfoVisible ? 1 : 0,
    pointerEvents: isInfoVisible ? 'auto' : 'none',
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContentWrapper} onClick={(e) => e.stopPropagation()}>
        {/* 情報パネル */}
        <div style={infoPanelStyle}>
          <h3 style={{ borderBottom: '2px solid #007acc', paddingBottom: '10px', marginBottom: '15px' }}>
            画像情報
          </h3>
          {loadingInfo ? (
            <p>読み込み中...</p>
          ) : imageInfo ? (
            <>
              <div style={styles.infoItem}><div style={styles.infoTitle}>ファイル名</div><div style={styles.infoContent}>{imageInfo.name}</div></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>ID</div><div style={styles.infoContent}>{imageInfo.id}</div></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>サイズ</div><div style={styles.infoContent}>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</div></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>解像度</div><div style={styles.infoContent}>{imageInfo.width} x {imageInfo.height}</div></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>タグ</div><div>{imageInfo.tags.map(tag => <span key={tag} style={styles.tag}>{tag}</span>)}</div></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>URL</div><a href={imageInfo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#66bfff' }}>{imageInfo.url}</a></div>
              <div style={styles.infoItem}><div style={styles.infoTitle}>メモ</div><div style={styles.infoContent}>{imageInfo.annotation}</div></div>
            </>
          ) : (
            <p>情報を取得できませんでした。</p>
          )}
        </div>

        {/* カルーセル */}
        <div style={styles.carouselContainer}>
          <Carousel
            selectedItem={currentSlideIndex}
            showThumbs={false}
            showStatus={false}
            showArrows={false}
            showIndicators={false}
            infiniteLoop={true}
            useKeyboardArrows={true}
            emulateTouch={true}
            onChange={(index) => setCurrentSlideIndex(index)}
            onClickItem={() => {}}
            centerMode={false}
            dynamicHeight={true}
          >
            {images.map((item, index) => (
              <div key={item.id}>
                <img
                  src={item.url}
                  alt={`Image ${index}`}
                  className="unselectable-image"
                  style={styles.image}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      {/* 閉じるボタン */}
      <button style={styles.closeButton} onClick={onClose}>×</button>

      {/* 情報表示切り替えボタン (modalContentWrapperの外に移動) */}
      <button style={styles.toggleInfoButton} onClick={toggleInfoPanel}>
        {isInfoVisible ? '情報を隠す' : '詳細を表示'}
      </button>
    </div>
  );
};

export default Modal;
