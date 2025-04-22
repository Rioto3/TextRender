'use client';

import { useState, useRef, useEffect } from "react";
import html2canvas from 'html2canvas';

export default function HtmlToImageTool() {
  const [markupUpperText, setMarkupUpperText] = useState(``);
  const [markupBottomText, setMarkupBottomText] = useState(``);

  // 状態変数に設定パネル表示フラグを追加
  const [showSettings, setShowSettings] = useState(false);
  const [textRate, setTextRate] = useState(3.3);
  const [selectedFont, setSelectedFont] = useState("lanobe-pop");
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.4); // 行間の比率を追加
  const [upperTextTop, setUpperTextTop] = useState(60); // 上部テキストの位置
  const [bottomTextBottom, setBottomTextBottom] = useState(225); // 下部テキストの位置
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null); // 背景画像
  const [isDragging, setIsDragging] = useState(false); // ドラッグ状態の管理
  const previewRef = useRef(null);
  const textContainerRef = useRef(null); // テキスト要素のみを含むコンテナへの参照
  const imageInputRef = useRef(null); // ファイル入力用の参照
  
  // 利用可能なフォントリスト
  const availableFonts = [
    { id: "hiragino", name: "ヒラギノ角ゴ" },
    { id: "sans-serif", name: "サンセリフ" },
    { id: "serif", name: "セリフ" },
    { id: "monospace", name: "等幅" },
    { id: "lanobe-pop", name: "ラノベPOP" },
    { id: "yuji-syuku", name: "游字様" },
    { id: "rampart-one", name: "ランパートワン" }
  ];
  
  // フォントのロード
  useEffect(() => {
    // カスタムフォントのスタイルをヘッドに追加
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'lanobe-pop';
        src: url('/fonts/LightNovelPOPv2.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'yuji-syuku';
        src: url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'rampart-one';
        src: url('https://fonts.googleapis.com/css2?family=Rampart+One&display=swap');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'hiragino';
        src: local('HiraginoSans-W3'), local('Hiragino Sans W3'), local('ヒラギノ角ゴ ProN W3'), local('Hiragino Kaku Gothic ProN W3');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const colorMap = {
    red: "#ff0000",
    orange: "#ffa500",
    yellow: "#ffff00",
    green: "#008000",
    blue: "#1e90ff",
    purple: "#800080",
    white: "#ffffff",
    black: "#000000"
  };
  
  const convertSimpleMarkupToHtml = (text) => {
    const withColors = text.replace(/<([a-z]+)>(.*?)<\/\1>/g, (match, color, content) => {
      const htmlColor = colorMap[color.toLowerCase()] || "#000";
      return `<span style="color:${htmlColor}">${content}</span>`;
    });
    return withColors.replace(/\n/g, "<br>");
  };
  
  // プレビュー表示用
  const upperHtml = convertSimpleMarkupToHtml(markupUpperText);
  const bottomHtml = convertSimpleMarkupToHtml(markupBottomText);
  
  // 基準となるサイズ (1080px幅、1920px高さ)
  const baseWidth = 1080;
  const baseHeight = 1920;
  
  // 緑領域の絶対座標と大きさ
  const redAreaTop = 500;
  const redAreaHeight = 680;
  
  // スケールファクター
  const scaleFactor = 360/baseWidth;

  // ドラッグ&ドロップ処理
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setBackgroundImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // ファイル選択処理
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像クリア
  const clearImage = () => {
    setBackgroundImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  
  // HTML要素から画像を生成して保存 - html2canvasライブラリを使用
  const saveAsImage = async () => {
    if (!textContainerRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // タイムスタンプ生成
      const now = new Date();
      const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
      
      // 一時的なコンテナを作成（スケーリングとフォントサイズ調整用）
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = `${baseWidth}px`; // 出力サイズと同じ幅
      tempContainer.style.height = `${baseHeight}px`; // 出力サイズと同じ高さ
      tempContainer.style.backgroundColor = '#FFFAFA'; // snow色の背景
      
      // 背景画像の追加（もし存在すれば）
      if (backgroundImage) {
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'absolute';
        imgContainer.style.top = `${redAreaTop}px`;
        imgContainer.style.left = '0';
        imgContainer.style.width = '100%';
        imgContainer.style.height = `${redAreaHeight}px`;
        imgContainer.style.overflow = 'hidden';
        imgContainer.style.display = 'flex';
        imgContainer.style.justifyContent = 'center';
        imgContainer.style.alignItems = 'center';
        
        const img = document.createElement('img');
        img.src = backgroundImage;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        
        imgContainer.appendChild(img);
        tempContainer.appendChild(imgContainer);
      }
      
      // テキストコンテナのクローンを作成
      const clone = textContainerRef.current.cloneNode(true);
      clone.style.width = '100%';
      clone.style.height = '100%';
      
      // 上部テキスト要素のフォントサイズを調整
      const upperTextClone = clone.querySelector('.upper-text');
      if (upperTextClone) {
        const originalSize = parseInt(getComputedStyle(textContainerRef.current.querySelector('.upper-text')).fontSize);
        const scaledSize = originalSize * (baseWidth / 360); // プレビューから出力サイズへのスケール
        upperTextClone.style.fontSize = `${scaledSize}px`;
        upperTextClone.style.top = `${upperTextTop * (baseWidth / 360)}px`;
      }
      
      // 下部テキスト要素のフォントサイズを調整
      const bottomTextClone = clone.querySelector('.bottom-text');
      if (bottomTextClone) {
        const originalSize = parseInt(getComputedStyle(textContainerRef.current.querySelector('.bottom-text')).fontSize);
        const scaledSize = originalSize * (baseWidth / 360); // プレビューから出力サイズへのスケール
        bottomTextClone.style.fontSize = `${scaledSize}px`;
        
        // bottom から top への変更
        bottomTextClone.style.top = `calc(100% - ${bottomTextBottom * (baseWidth / 360)}px)`;
      }
      
      // クローンを一時コンテナに追加
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);
      
      // html2canvasを使用してHTML要素をキャンバスに変換
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#FFFAFA', // snow色の背景
        width: baseWidth,
        height: baseHeight,
        scale: 1, // スケールは1に設定（既に適切なサイズにスケーリング済み）
        useCORS: true, // 外部リソースの読み込み許可
        logging: false // ログ出力を無効化
      });
      
      // 一時コンテナを削除
      document.body.removeChild(tempContainer);
      
      // Canvas要素からデータURLを生成
      const dataUrl = canvas.toDataURL('image/png');
      
      // ダウンロードリンク作成
      const link = document.createElement('a');
      link.download = `text_image_${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error("画像の保存に失敗しました:", error);
      alert("画像の保存に失敗しました: " + (error ? error.toString() : "不明なエラー"));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // モバイルエリアコンポーネント
  const MobilArea = ({ textRate = 1 }) => {
    return (
      <div 
        className="relative w-full h-full"
        style={{
          backgroundColor: "#FFFAFA" // snow色の背景
        }}
        ref={previewRef}
        id="preview-container"
      >
        {/* テキスト要素のみを含むコンテナ（透明背景） */}
        <div 
          ref={textContainerRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundColor: "transparent",
            overflow: "hidden"
          }}
          id="text-container"
        >
          {/* 上部テキスト - 絶対配置 */}
          <div
            className="text-center upper-text"
            style={{
              position: "absolute",
              top: `${upperTextTop}px`,
              left: "0",
              width: "100%",
              padding: '0',
              fontSize: `${24 * scaleFactor * textRate}px`,
              lineHeight: lineHeight,
              fontFamily: selectedFont,
              fontWeight: fontWeight,
              whiteSpace: 'pre-line', // 明示的な改行のみを反映
              zIndex: 2 // 背景画像より前に表示
            }}
            dangerouslySetInnerHTML={{ __html: upperHtml }}
          />
          
          {/* 下部テキスト - 絶対配置 */}
          <div
            className="text-center bottom-text"
            style={{
              position: "absolute",
              top: `calc(100% - ${bottomTextBottom}px)`, 
              left: "0",
              width: "100%",
              padding: '0',
              fontSize: `${24 * scaleFactor * textRate}px`,
              lineHeight: lineHeight,
              fontFamily: selectedFont,
              fontWeight: fontWeight,
              whiteSpace: 'pre-line', // 明示的な改行のみを反映
              zIndex: 2 // 背景画像より前に表示
            }}
            dangerouslySetInnerHTML={{ __html: bottomHtml }}
          />
        </div>
        
        {/* 中央の画像エリア */}
        <div 
          className={`image-drop-area ${isDragging ? 'border-dashed border-2 border-blue-400' : ''}`}
          style={{
            position: 'absolute',
            top: `${redAreaTop * scaleFactor}px`,
            left: "0",
            width: "100%",
            height: `${redAreaHeight * scaleFactor}px`,
            backgroundColor: backgroundImage ? 'transparent' : '#90EE90', // 画像がない場合は薄い緑色
            zIndex: 1,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => imageInputRef.current && imageInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {backgroundImage ? (
            // 背景画像がある場合は表示
            <img 
              src={backgroundImage} 
              alt="背景画像"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            // 背景画像がない場合はプレースホルダーテキスト
            <div
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                textAlign: 'center',
                padding: '0 10px'
              }}
            >
              ここに画像をドロップするか、クリックして選択
            </div>
          )}
          <input 
            type="file" 
            ref={imageInputRef}
            onChange={handleFileInput}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  };

  // 設定パネル表示切り替え関数
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="flex flex-col w-full md:w-1/2 gap-4">
        <textarea
          className="w-full h-48 p-2 border rounded"
          value={markupUpperText}
          onChange={(e) => setMarkupUpperText(e.target.value)}
          placeholder="上部テキストを入力（<color>タグで色指定可能）"
        />
        <textarea
          className="w-full h-48 p-2 border rounded"
          value={markupBottomText}
          onChange={(e) => setMarkupBottomText(e.target.value)}
          placeholder="下部テキストを入力（<color>タグで色指定可能）"
        />
          
        <div className="flex flex-col gap-4">
          <button
            onClick={toggleSettings}
            className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            {showSettings ? '詳細設定を閉じる' : '詳細設定を開く'}
          </button>

          {/* 詳細設定パネル - showSettingsがtrueのときのみ表示 */}
          {showSettings && (
            <div className="flex flex-col gap-4 border p-3 rounded bg-gray-50">
              {/* テキストサイズ調整 */}
              <div>
                <label className="mb-2 block">テキストサイズ倍率: {textRate.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={textRate}
                  onChange={(e) => setTextRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* 行間の調整 */}
              <div>
                <label className="mb-2 block">行間設定: {lineHeight.toFixed(1)}</label>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* 上部テキスト位置の調整 */}
              <div>
                <label className="mb-2 block">上部テキスト位置: {upperTextTop}px</label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={upperTextTop}
                  onChange={(e) => setUpperTextTop(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* 下部テキスト位置の調整 */}
              <div>
                <label className="mb-2 block">下部テキスト位置: {bottomTextBottom}px</label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={bottomTextBottom}
                  onChange={(e) => setBottomTextBottom(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* フォントウェイト選択 */}
              <div className="my-2">
                <label className="block mb-2 font-medium">フォントの太さ:</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setFontWeight(weight)}
                      className={`px-3 py-1 border rounded ${
                        fontWeight === weight 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{ fontWeight: weight }}
                    >
                      {weight === 400 ? '標準' : 
                      weight < 400 ? '細' + (400 - weight) / 100 : 
                      '太' + (weight - 400) / 100}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* フォント選択 */}
              <div className="my-2">
                <label className="block mb-2 font-medium">フォント選択:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableFonts.map((font) => (
                    <div key={font.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`font-${font.id}`}
                        name="font-selector"
                        value={font.id}
                        checked={selectedFont === font.id}
                        onChange={() => setSelectedFont(font.id)}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`font-${font.id}`}
                        style={{ fontFamily: font.id, fontWeight: fontWeight }}
                        className="cursor-pointer"
                      >
                        {font.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 背景画像管理 */}
              <div className="my-2">
                <label className="block mb-2 font-medium">背景画像:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => imageInputRef.current && imageInputRef.current.click()}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    画像を選択
                  </button>
                  <button
                    onClick={clearImage}
                    className={`px-3 py-1 rounded ${backgroundImage ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    disabled={!backgroundImage}
                  >
                    画像をクリア
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 保存ボタン */}
          <button 
            onClick={saveAsImage}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? '処理中...' : '画像として保存'}
          </button>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center mt-4 md:mt-0">
        <div
          className="border rounded overflow-hidden"
          style={{ 
            width: "360px", 
            height: "640px", 
            maxWidth: "100%", 
            aspectRatio: "9 / 16", 
            position: "relative",
            backgroundColor: "#FFFAFA" // snow色の背景
          }}
        >
          <MobilArea textRate={textRate} />
        </div>
      </div>
    </div>
  );
}