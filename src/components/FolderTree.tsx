import React, { useState, useEffect } from 'react';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface FolderTreeProps {
  onSelectFolder: (folderId: string | null) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ onSelectFolder }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/eagle/folder/list');
        if (!response.ok) {
          throw new Error('フォルダリストの取得に失敗しました');
        }
        const data = await response.json();
        setFolders(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchFolders();
  }, []);

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    onSelectFolder(folderId);
  };

  const renderFolder = (folder: Folder) => (
    <li key={folder.id}>
      <div
        className={`folder-badge ${folder.id === selectedFolderId ? 'selected' : ''}`}
        onClick={() => handleFolderClick(folder.id)}
      >
        {folder.name}
      </div>
      {folder.children && folder.children.length > 0 && (
        <ul className="sub-folder-list">
          {folder.children.map(renderFolder)}
        </ul>
      )}
    </li>
  );

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '10px', borderRight: '1px solid #ccc', overflowY: 'auto', maxHeight: '300px' }}>
      <h3>Folders</h3>
      <ul className="folder-list">
        <li key="all-images">
          <div
            className={`folder-badge ${selectedFolderId === null ? 'selected' : ''}`}
            onClick={() => {
              setSelectedFolderId(null);
              onSelectFolder(null);
            }}
          >
            All Images
          </div>
        </li>
        {folders.map(renderFolder)}
      </ul>
    </div>
  );
};

export default FolderTree;
