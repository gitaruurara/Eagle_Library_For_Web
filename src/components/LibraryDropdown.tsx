import React, { useEffect, useState } from "react";

interface LibraryDropdownProps {
onLibrarySwitch: (selectedLibrary: string) => void; // 選択されたライブラリ名を渡すコールバック
}

const switchLibrary = async (libraryName: string) => {
try {
  const response = await fetch(`/eagle/library/switch/${libraryName}`);
  if (!response.ok) {
    throw new Error(`ライブラリの切り替えに失敗しました: ${libraryName}`);
  }
  const data = await response.json();
  console.log(data.message); // 切り替え成功メッセージをログに出力
} catch (error) {
  console.error(error);
}
};

const LibraryDropdown: React.FC<LibraryDropdownProps> = ({ onLibrarySwitch }) => {
const [libraries, setLibraries] = useState<{ name: string; path: string }[]>([]);
const [selectedLibrary, setSelectedLibrary] = useState<string>("");

useEffect(() => {
const fetchLibraries = async () => {
 try {
   const libraryListResponse = await fetch("/eagle/library_list");
   if (!libraryListResponse.ok) {
     throw new Error("ライブラリ一覧の取得に失敗しました");
   }
   const libraryListData = await libraryListResponse.json();
   setLibraries(Object.entries(libraryListData).map(([name, path]) => ({ name, path: path as string })));

   const currentLibraryResponse = await fetch("/eagle/library/current");
   if (!currentLibraryResponse.ok) {
     throw new Error("現在のライブラリ名の取得に失敗しました");
   }
   let currentLibrary = await currentLibraryResponse.text();
   currentLibrary = currentLibrary.replace(/^"|"$/g, "").trim(); // 余分なダブルクォートを削除
   setSelectedLibrary(currentLibrary); // 現在のライブラリをセット
   console.log(`現在のライブラリ: ${currentLibrary}`);
 } catch (error) {
   console.error(error);
 }
};
fetchLibraries();
}, []);


const handleLibraryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedName = e.target.value;
  setSelectedLibrary(selectedName);
  switchLibrary(selectedName);
  onLibrarySwitch(selectedName); // 選択されたライブラリ名を渡す
};

return (
  <div className="library-selector-container">
    <label htmlFor="library-select" className="library-label">ライブラリを選択:</label>
    <select
      id="library-select"
      value={selectedLibrary}
      onChange={handleLibraryChange}
      className="library-dropdown"
    >
      {libraries.map((lib) => (
        <option key={lib.name} value={lib.name}>
          {lib.name}
        </option>
      ))}
    </select>
  </div>
);
};

export default LibraryDropdown;