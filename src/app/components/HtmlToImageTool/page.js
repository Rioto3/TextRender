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
  const [imageUrl, setImageUrl] = useState(''); 


  
  
  // テキスト選択関連の状態
  const [selectedTextInfo, setSelectedTextInfo] = useState({
    isActive: false,
    text: '',
    target: null, // 'upper' または 'bottom'
    start: 0,
    end: 0
  });
  
  const previewRef = useRef(null);
  const textContainerRef = useRef(null); // テキスト要素のみを含むコンテナへの参照
  const imageInputRef = useRef(null); // ファイル入力用の参照
  const upperTextRef = useRef(null); // 上部テキストエリアへの参照
  const bottomTextRef = useRef(null); // 下部テキストエリアへの参照
  
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
  
  // カラーマップ（色名と色コード）
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
  
  // テキスト選択イベントハンドラ
  const handleTextSelect = (event, target) => {
    const textarea = event.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (start !== end) {
      setSelectedTextInfo({
        isActive: true,
        text: selectedText,
        target,
        start,
        end
      });
    } else {
      // 選択範囲がない場合
      setSelectedTextInfo({
        isActive: false,
        text: '',
        target: null,
        start: 0,
        end: 0
      });
    }
  };
  
  // カラータグを挿入する関数
  const insertColorTag = (color) => {
    if (!selectedTextInfo.isActive) return;
    
    const { target, start, end, text } = selectedTextInfo;
    const taggedText = `<${color}>${text}</${color}>`;
    
    if (target === 'upper') {
      const newText = 
        markupUpperText.substring(0, start) + 
        taggedText + 
        markupUpperText.substring(end);
      
      setMarkupUpperText(newText);
      
      // カーソル位置を保持するための処理
      setTimeout(() => {
        if (upperTextRef.current) {
          upperTextRef.current.focus();
          const newCursorPos = start + taggedText.length;
          upperTextRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else if (target === 'bottom') {
      const newText = 
        markupBottomText.substring(0, start) + 
        taggedText + 
        markupBottomText.substring(end);
      
      setMarkupBottomText(newText);
      
      // カーソル位置を保持するための処理
      setTimeout(() => {
        if (bottomTextRef.current) {
          bottomTextRef.current.focus();
          const newCursorPos = start + taggedText.length;
          bottomTextRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
    
    // 選択状態をリセット
    setSelectedTextInfo({
      isActive: false,
      text: '',
      target: null,
      start: 0,
      end: 0
    });
  };
  
  // HTML生成用の関数
// ダークモード対応のHTML生成関数
const convertSimpleMarkupToHtml = (text, darkMode = false) => {
  return text.replace(/<([a-z]+)>(.*?)<\/\1>/g, (match, color, content) => {
    let htmlColor;
    
    // ダークモードでの色変換
    if (darkMode) {
      if (color.toLowerCase() === 'white') {
        htmlColor = "#000000"; // white → black
      } else if (color.toLowerCase() === 'black') {
        htmlColor = "#ffffff"; // black → white
      } else {
        htmlColor = colorMap[color.toLowerCase()] || "#ffffff";
      }
    } else {
      // 通常モード
      htmlColor = colorMap[color.toLowerCase()] || "#000000";
    }
    
    return `<span style="color:${htmlColor}">${content}</span>`;
  }).replace(/\n/g, "<br>");
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
  
  const saveAsImage = async (darkMode = false) => {
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
      tempContainer.style.backgroundColor = darkMode ? '#121212' : '#FFFAFA'; // ダークモードか通常モードの背景色
      
      // 背景画像の追加（もし存在すれば）
      if (backgroundImage) {
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'absolute';
        imgContainer.style.top = `${redAreaTop}px`;
        imgContainer.style.left = '0';
        imgContainer.style.width = '100%';
        imgContainer.style.height = `${redAreaHeight}px`;
        imgContainer.style.overflow = 'hidden';
        
        const img = document.createElement('img');
        img.src = backgroundImage;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center';
        
        // ダークモードの場合、画像に暗さフィルターを適用
        if (darkMode) {
          img.style.filter = 'brightness(0.8)';
        }
        
        imgContainer.appendChild(img);
        tempContainer.appendChild(imgContainer);
      }
      
      // 上部テキスト - ダークモード考慮
      const upperTextElement = document.createElement('div');
      upperTextElement.style.position = 'absolute';
      upperTextElement.style.top = `${upperTextTop * (baseWidth / 360)}px`;
      upperTextElement.style.left = '0';
      upperTextElement.style.width = '100%';
      upperTextElement.style.textAlign = 'center';
      upperTextElement.style.padding = '0';
      const originalUpperSize = parseInt(getComputedStyle(textContainerRef.current.querySelector('.upper-text')).fontSize);
      const scaledUpperSize = originalUpperSize * (baseWidth / 360);
      upperTextElement.style.fontSize = `${scaledUpperSize}px`;
      upperTextElement.style.lineHeight = lineHeight;
      upperTextElement.style.fontFamily = selectedFont;
      upperTextElement.style.fontWeight = fontWeight;
      upperTextElement.style.whiteSpace = 'pre-line';
      upperTextElement.style.zIndex = '2';
      
      // ダークモードではデフォルトテキスト色を白に設定
      if (darkMode) {
        upperTextElement.style.color = '#ffffff';
      }
      
      upperTextElement.innerHTML = convertSimpleMarkupToHtml(markupUpperText, darkMode);
      
      // 下部テキスト - ダークモード考慮
      const bottomTextElement = document.createElement('div');
      bottomTextElement.style.position = 'absolute';
      bottomTextElement.style.top = `calc(100% - ${bottomTextBottom * (baseWidth / 360)}px)`;
      bottomTextElement.style.left = '0';
      bottomTextElement.style.width = '100%';
      bottomTextElement.style.textAlign = 'center';
      bottomTextElement.style.padding = '0';
      const originalBottomSize = parseInt(getComputedStyle(textContainerRef.current.querySelector('.bottom-text')).fontSize);
      const scaledBottomSize = originalBottomSize * (baseWidth / 360);
      bottomTextElement.style.fontSize = `${scaledBottomSize}px`;
      bottomTextElement.style.lineHeight = lineHeight;
      bottomTextElement.style.fontFamily = selectedFont;
      bottomTextElement.style.fontWeight = fontWeight;
      bottomTextElement.style.whiteSpace = 'pre-line';
      bottomTextElement.style.zIndex = '2';
      
      // ダークモードではデフォルトテキスト色を白に設定
      if (darkMode) {
        bottomTextElement.style.color = '#ffffff';
      }
      
      bottomTextElement.innerHTML = convertSimpleMarkupToHtml(markupBottomText, darkMode);
      
      // テキスト要素をコンテナに追加
      tempContainer.appendChild(upperTextElement);
      tempContainer.appendChild(bottomTextElement);
      
      // 一時コンテナをDOMに追加
      document.body.appendChild(tempContainer);
      
      // html2canvasを使用してHTML要素をキャンバスに変換
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: darkMode ? '#121212' : '#FFFAFA', // ダークモードか通常モードの背景色
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
      const mode = darkMode ? 'dark' : 'light';
      link.download = `text_image_${mode}_${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error("画像の保存に失敗しました:", error);
      alert("画像の保存に失敗しました: " + (error ? error.toString() : "不明なエラー"));
    } finally {
      setIsProcessing(false);
    }
  };



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
              whiteSpace: 'pre-line',
              zIndex: 2
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
              whiteSpace: 'pre-line',
              zIndex: 2
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
            backgroundColor: backgroundImage ? 'transparent' : '#eaffd6',
            zIndex: 1,
            overflow: 'hidden'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 背景画像があれば表示（低いz-index） */}
          {backgroundImage && (
            <img 
              src={backgroundImage} 
              alt="背景画像"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                position: 'absolute',
                zIndex: 1
              }}
            />
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
  
  const loadImageFromUrl = () => {
    if (imageUrl) {
      // 有効なURLかチェック
      try {
        new URL(imageUrl);
        setBackgroundImage(imageUrl);
      } catch (e) {
        alert('有効なURLを入力してください');
      }
    }
  };
  
  // カラーピッカーコンポーネント
  const ColorPicker = ({ show }) => {
    if (!show) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1 mb-2 p-1 border rounded bg-gray-100">
        <div className="w-full text-xs text-gray-600 mb-1">テキストに適用する色:</div>
        {Object.keys(colorMap).map(color => (
          <button
            key={color}
            onClick={() => insertColorTag(color)}
            className="w-8 h-8 rounded border"
            style={{ 
              backgroundColor: colorMap[color],
              color: ['white', 'yellow'].includes(color) ? 'black' : 'white',
              fontSize: '9px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
            title={`${color}色を適用`}
          >
            {color.substring(0, 1).toUpperCase()}
          </button>
        ))}
      </div>
    );
  };



      // Enter キーでの適用を処理するハンドラを追加
      const handleImageUrlKeyPress = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          loadImageFromUrl();
          setImageUrl(''); // 適用後にURLフィールドをクリア
        }
      };
    
      // ロード関数のラッパー - URL入力フィールドをクリアする
      const loadImageAndClear = () => {
        loadImageFromUrl();
        setImageUrl(''); // URL適用後にクリア
      };
    
      // 両方のモードで保存する関数
      const saveAsBothModes = async () => {
        if (isProcessing) return;
        await saveAsImage(false); // 通常モード保存
        await saveAsImage(true);  // ダークモード保存
      };

      // clearAllText 関数の実装
const clearAllText = () => {
  setMarkupUpperText('');
  setMarkupBottomText('');
};
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="flex flex-col w-full md:w-1/2 gap-4">
        <div>
          <label className="block mb-1 font-medium">上部テキスト:</label>
          <textarea
            ref={upperTextRef}
            className="w-full h-36 p-2 border rounded font-mono"
            value={markupUpperText}
            onChange={(e) => setMarkupUpperText(e.target.value)}
            onSelect={(e) => handleTextSelect(e, 'upper')}
            placeholder="上部テキストを入力（<color>タグで色指定可能）"
          />
          <ColorPicker show={selectedTextInfo.isActive && selectedTextInfo.target === 'upper'} />
        </div>

        <div id="work-area">


            <div className="flex gap-2 mb-3">

              
         {/* テキストクリアボタン */}
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllText();
                }}
                className="px-2 py-1 bg-[#ffbcdd] text-white rounded hover:bg-red-600 text-xs "
              >

                ffd6ea
                 クリア
              </button>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                // onKeyPress={handleImageUrlKeyPress} // Enterキーでの適用対応
                placeholder="画像URLを入力... (Enterで適用)"
                className="flex-grow p-2 border rounded text-sm bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadImageAndClear(); // クリア機能を追加
                }}
                className="px-3 py-1 bg-[#bddeff] text-white rounded hover:bg-blue-600 text-sm"
              >
                適用
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  saveAsBothModes();
                }}
                className="px-2 py-1 bg-[#d3bdff] text-white rounded hover:bg-purple-700 disabled:bg-purple-400 text-xs"
                disabled={isProcessing}
              >
                {isProcessing ? '処理中...' : '両方保存'}
              </button>
            </div>

        </div>
        <div>
          
          <textarea
            ref={bottomTextRef}
            className="w-full h-36 p-2 border rounded font-mono"
            value={markupBottomText}
            onChange={(e) => setMarkupBottomText(e.target.value)}
            onSelect={(e) => handleTextSelect(e, 'bottom')}
            placeholder="下部テキストを入力（<color>タグで色指定可能）"
          />
          <ColorPicker show={selectedTextInfo.isActive && selectedTextInfo.target === 'bottom'} />
          <label className="block mb-1 font-medium">下部テキスト:</label>
        </div>
          
        <div className="flex flex-col gap-4">


          {/* 保存ボタン */}
          <div className="flex flex-wrap gap-2">
          <button 
        onClick={() => saveAsImage(false)}
        className="p-2 bg-[#bddeff] text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex-1"
        disabled={isProcessing}
      >
        {isProcessing ? '処理中...' : '通常モードで保存'}
      </button>
      
      <button 
        onClick={() => saveAsImage(true)}
        className="p-2 bg-[#999999] text-white rounded hover:bg-gray-900 disabled:bg-gray-600 flex-1"
        disabled={isProcessing}
      >
        {isProcessing ? '処理中...' : 'ダークモードで保存'}
      </button>
    </div>

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

                      
                <div className="mt-3">
                  <label className="block mb-1 text-sm font-medium">画像URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-grow p-2 border rounded text-sm"
                    />
                    <button
                      onClick={loadImageFromUrl}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      読み込み
                    </button>
                  </div>
                </div>
                      
                <div className="mt-2 text-sm text-gray-600">
                  <p>※画像は表示エリアいっぱいに拡大されます</p>
                </div>
              </div>
              
              {/* カラータグ説明 */}
              <div className="my-2">
                <label className="block mb-2 font-medium">カラータグの使い方:</label>
                <div className="p-2 bg-gray-100 rounded text-sm">
                  <p>テキストを選択すると色ボタンが表示されます。色ボタンをクリックすると選択テキストに自動的にカラータグが適用されます。</p>
                  <p className="mt-1">対応色: {Object.keys(colorMap).join(', ')}</p>
                  <p className="mt-1">例: <code>&lt;red&gt;赤色テキスト&lt;/red&gt;</code></p>
                </div>
              </div>
            </div>
          )}


    
    <div className="text-sm text-gray-600">
      <p>※ダークモード保存時は背景が暗くなり、白色テキストは黒色に変換されます</p>
    </div>
        </div>
      </div>

<div className="w-full md:w-1/2 flex flex-col items-center justify-center mt-4 md:mt-0">

  
  {/* プレビューエリア */}
  <div
    className="border rounded overflow-hidden"
    style={{ 
      width: "360px", 
      height: "640px", 
      maxWidth: "100%", 
      aspectRatio: "9 / 16", 
      position: "relative",
      backgroundColor: "#FFFAFA"
    }}
  >
    <MobilArea textRate={textRate} />
  </div>
</div>
    </div>
  );
}
