import React, { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import "./styles/App.css";
import LibraryDropdown from "./components/LibraryDropdown";
import Modal from "./components/Modal"; // モーダルコンポーネントをインポート
import FolderTree from "./components/FolderTree"; // FolderTreeコンポーネントをインポート
import ImageItem from "./components/ImageItem"; // ImageItemコンポーネントをインポート



const App: React.FC = () => {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null); // 選択された画像のインデックス
  const [currentLibrary, setCurrentLibrary] = useState<string>("");
  const [columnCount, setColumnCount] = useState<number>(4); // スライダーで調整する列数
  const [isPanelHidden, setIsPanelHidden] = useState<boolean>(true); // パネルの表示/非表示
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // 選択されたフォルダのID
  const [hasMore, setHasMore] = useState<boolean>(true); // さらに画像があるかどうか
  const isFetching = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // ローディング状態
  const panelRef = React.useRef<HTMLDivElement>(null); // パネルの参照

  // コンポーネントがマウントされたときに現在のライブラリ名を取得
  useEffect(() => {
    const fetchInitialLibrary = async () => {
      try {
        const response = await fetch("/eagle/library/current");
        if (!response.ok) {
          throw new Error(`現在のライブラリ名の取得に失敗しました: ${response.statusText}`);
        }
        let currentLibraryName = await response.text();
        currentLibraryName = currentLibraryName.replace(/^"|"$/g, "").trim();
        setCurrentLibrary(currentLibraryName);
        console.log(`Initial load: Fetched current library: "${currentLibraryName}"`);
      } catch (error) {
        console.error("Initial load: Error fetching current library:", error);
      }
    };
    fetchInitialLibrary();
  }, []); // 空の依存配列で初回マウント時のみ実行


  const fetchImages = async (newOffset: number, folderId: string | null) => {
    console.log("fetchImages: START. newOffset:", newOffset, "folderId:", folderId, "isFetching.current (before check):", isFetching.current);

    // 既存のフェッチをキャンセル
    if (abortControllerRef.current) {
      console.log("fetchImages: Aborting previous fetch.");
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    isFetching.current = true;
    setIsLoading(true); // フェッチ開始時にローディング状態をtrueに
    console.log("fetchImages: isFetching.current set to TRUE.");

    try {
      const newLimit = newOffset + 20;
      const folderParam = folderId ? `&folderId=${folderId}` : "";
      console.log(`fetchImages: Fetching URL: /eagle/library/image_list?limit=${newLimit}&offset=${newOffset}${folderParam}`);
      const response = await fetch(`/eagle/library/image_list?limit=${newLimit}&offset=${newOffset}${folderParam}`, { signal });

      if (!response.ok) {
        throw new Error("画像リストの取得に失敗しました");
      }
      const data = await response.json();
      console.log("fetchImages: Received data:", data); // APIからの応答内容をログ出力

      const imageUrls = data.map((item: { id: string; thumbnailUrl: string }) => {
        const uniqueId = item.id && item.id.trim() !== '' ? item.id : `generated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id: uniqueId,
          url: item.thumbnailUrl,
        };
      });
      console.log("fetchImages: Mapped imageUrls:", imageUrls); // マッピング後の画像URLをログ出力
      imageUrls.forEach(img => console.log("Image ID:", img.id)); // 各画像のIDをログ出力

      if (imageUrls.length === 0) {
        setHasMore(false);
        console.log("fetchImages: No more images. setHasMore to FALSE.");
      } else {
        setHasMore(true);
      }

      setImages((prevImages) => {
        const allImages = [...prevImages, ...imageUrls];
        const uniqueImagesMap = new Map<string, { id: string; url: string }>();
        allImages.forEach(img => {
          uniqueImagesMap.set(img.id, img);
        });
        const updatedImages = Array.from(uniqueImagesMap.values());
        console.log("fetchImages: Appending images. Current images count:", updatedImages.length);
        return updatedImages; 
      });
      setOffset(newOffset + 20);
      console.log("fetchImages: setOffset to", newOffset + 20);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('fetchImages: Fetch aborted:', err.message);
      } else {
        console.error('fetchImages: Error:', err.message);
      }
    } finally {
      isFetching.current = false;
      setIsLoading(false); // フェッチ終了時にローディング状態をfalseに
      abortControllerRef.current = null; // フェッチ完了後にコントローラをリセット
      console.log("fetchImages: FINISH. isFetching.current:", isFetching.current);
    }

  };

  const resetImages = async (selectedLibrary: string) => {
    console.log("resetImages: Called with selectedLibrary:", selectedLibrary); // Added log
    setImages([]); // 画像リストをリセット
    setOffset(0); // オフセットをリセット
    setSelectedFolderId(null); // フォルダ選択をリセット

    const checkCurrentLibrary = async () => {
      console.log("checkCurrentLibrary: Attempting to fetch current library."); // Added log
      try {
        const response = await fetch("/eagle/library/current");
        console.log("checkCurrentLibrary: Fetch response status:", response.status); // Added log
        if (!response.ok) {
          throw new Error(`現在のライブラリ名の取得に失敗しました: ${response.statusText}`); // More descriptive error
        }
        let currentLibrary = await response.text();
        currentLibrary = currentLibrary.replace(/^"|"$/g, "").trim(); // 余分なダブルクォートを削除
        setCurrentLibrary(currentLibrary); // currentLibraryを更新
        console.log(`checkCurrentLibrary: Fetched current library: "${currentLibrary}"`); // Added log
        console.log(`checkCurrentLibrary: Comparing fetched ("${currentLibrary}") with selected ("${selectedLibrary.trim()}")`); // Added log

        if (currentLibrary === selectedLibrary.trim()) { // 空白を除去して比較
          console.log("checkCurrentLibrary: Libraries match. Reloading page.");
          window.location.reload(); // ライブラリが一致したらリロード
        } else {
          console.log("checkCurrentLibrary: Libraries do not match. Retrying in 1 second."); // Added log
          setTimeout(checkCurrentLibrary, 1000); // 一致しない場合は1秒後に再試行
        }
      } catch (error) {
        console.error("checkCurrentLibrary: Error during fetch or processing:", error); // More descriptive error log
        setTimeout(checkCurrentLibrary, 1000); // エラー時も再試行
      }
    };

    await checkCurrentLibrary();
  };

  const handleSelectFolder = (folderId: string | null) => {
    console.log("handleSelectFolder called with folderId:", folderId);
    setSelectedFolderId(folderId);
  };

  // 画像を最初に取得するように設定
  useEffect(() => {
    console.log("useEffect [selectedFolderId]: Folder changed or initial load. selectedFolderId:", selectedFolderId);

    // 既存のフェッチをキャンセル
    if (abortControllerRef.current) {
      console.log("useEffect [selectedFolderId]: Aborting previous fetch.");
      abortControllerRef.current.abort();
      abortControllerRef.current = null; // コントローラをリセット
    }

    setImages([]); // フォルダが変わったら画像をリセット
    setOffset(0); // オフセットもリセット
    setHasMore(true); // 新しいフォルダではhasMoreをリセット

    fetchImages(0, selectedFolderId); // 新しいフォルダで画像を再取得
  }, [selectedFolderId]); // selectedFolderIdが変更されたときに実行

useEffect(() => {
  console.log("useEffect [images, columnCount, selectedFolderId]: Setting up IntersectionObserver.");
  // IntersectionObserverの設定
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("IntersectionObserver: Last image intersected. Fetching new images...");
          const newOffset = offset + 20;
          fetchImages(newOffset, selectedFolderId); // isFetchingの管理はfetchImages内で行う
        }
      });
    },
    { root: null, threshold: 0.1 } // 10%画面内に入った場合に発火
  );

  // 最後の画像を監視
  const lastImage = document.querySelector('.masonry-grid-column:last-child img:last-child');
  if (lastImage && hasMore) {
    console.log("IntersectionObserver: Observing last image.");
    observer.observe(lastImage);
  } else if (!hasMore) {
    console.log("IntersectionObserver: No more images to load. Disconnecting observer.");
    observer.disconnect();
  } else {
    console.log("IntersectionObserver: Last image not found.");
  }

  // クリーンアップ処理
  return () => {
    console.log("IntersectionObserver: Cleaning up observer and wheel event.");
    observer.disconnect();
    // window.removeEventListener("wheel", handleWheel); // マウスホイールイベントの解除
  };
}, [offset, columnCount, selectedFolderId, hasMore]); // offset, columnCount, selectedFolderId, hasMoreを依存配列に追加


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target) && !target.classList.contains('toggle-button')) {
        setIsPanelHidden(true);
      }
    };

    const handleScroll = () => {
      setIsPanelHidden(true);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [panelRef]);


const openModal = (index: number) => {
  setSelectedImageIndex(index);
  setIsModalOpen(true);
};
const closeModal = () => {
  setIsModalOpen(false);
  setSelectedImageIndex(null);
};

const handleCancelAndRetry = () => {
  if (abortControllerRef.current) {
    console.log("Breakthrough button: Aborting current fetch.");
    abortControllerRef.current.abort();
    abortControllerRef.current = null; // Reset controller
  }
  // Ensure loading states are reset
  isFetching.current = false;
  setIsLoading(false);
  console.log("Breakthrough button: Fetch state reset. Retrying fetch from start.");
  // Retry fetching from the beginning
  setImages([]); // Clear existing images to start fresh
  setOffset(0);
  setHasMore(true);
  fetchImages(0, selectedFolderId);
};


return (
    <div style={{ display: "flex", height: "100vh" }}>
      <button className="toggle-button" onClick={() => setIsPanelHidden(!isPanelHidden)}>
        {isPanelHidden ? '▶' : '◀'}
      </button>
      <div ref={panelRef} className={`control-panel ${isPanelHidden ? 'hidden' : ''}`}>
        <div className="current-library-display-modern">現在のライブラリ: <span>{currentLibrary}</span></div>
        <LibraryDropdown onLibrarySwitch={resetImages} />
        <div className="slider-container">
          <label htmlFor="column-slider" className="slider-label">in</label>
          <input
            type="range"
            id="column-slider"
            min="10"
            max="100"
            step=".1"
            value={columnCount * 10}
            onChange={(e) => {
              const newColumnCount = Math.round(Number(e.target.value) / 10);
              console.log("Slider value changed, new columnCount:", newColumnCount);
              setColumnCount(newColumnCount);
            }}
            className="column-slider"
          />
          <label htmlFor="column-slider" className="slider-label">out</label>
        </div>
        <FolderTree onSelectFolder={handleSelectFolder} />
      </div>
      <div style={{ flexGrow: 1, overflowY: "auto" }} className={`main-content ${isPanelHidden ? 'full-width' : ''}`}>
        <Masonry
          breakpointCols={columnCount}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {images.map((item, index) => (
            <ImageItem
              key={item.id} // keyをitem.idに変更
              item={item}
              index={index}
              openModal={openModal}
            />
          ))}
        </Masonry>

        {isModalOpen && selectedImageIndex !== null && (
          <Modal
            images={images}
            selectedImageIndex={selectedImageIndex}
            onClose={closeModal}
          />
        )}

        {isLoading && ( 
          <div className="loading-indicator">
            <img src="/assets/spinner_icon.webp" alt="Loading..." className="spinner-icon" />
            <p>Loading images...</p>
          </div>
        )}
        {/* フェッチが停止した場合の打開ボタン - 常に表示 */}
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button onClick={handleCancelAndRetry} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            画像を再読み込み / 再試行
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;