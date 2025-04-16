'use client';

import { useState, useRef, useEffect } from "react";
import { toPng } from 'html-to-image';

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
  const [bottomTextBottom, setBottomTextBottom] = useState(220); // 下部テキストの位置
  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef(null);
  const textContainerRef = useRef(null); // テキスト要素のみを含むコンテナへの参照
  
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
  
  // HTML要素から画像を生成して保存
  const saveAsImage = async () => {
    if (!textContainerRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // タイムスタンプ生成
      const now = new Date();
      const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
      
      // HTML要素からPNG画像データを生成
      const dataUrl = await toPng(textContainerRef.current, {
        backgroundColor: null, // 透明な背景
        width: 1080,
        height: 1920,
        canvasWidth: 1080,
        canvasHeight: 1920,
        pixelRatio: 1,
        skipAutoScale: true,
        style: {
          transform: 'scale(3)', // スケールを調整
          transformOrigin: 'top left'
        }
      });
      
      // ダウンロードリンク作成
      const link = document.createElement('a');
      link.download = `text_image_${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error("画像の保存に失敗しました:", error);
      alert("画像の保存に失敗しました: " + (error?.message || "不明なエラー"));
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
          backgroundColor: "white"
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
              zIndex: 1
            }}
            dangerouslySetInnerHTML={{ __html: upperHtml }}
          />
          
          {/* 下部テキスト - 絶対配置 */}
          <div
            className="text-center bottom-text"
            style={{
              position: "absolute",
              bottom: `${bottomTextBottom}px`,
              left: "0",
              width: "100%",
              padding: '0',
              fontSize: `${24 * scaleFactor * textRate}px`,
              lineHeight: lineHeight,
              fontFamily: selectedFont,
              fontWeight: fontWeight,
              whiteSpace: 'pre-line', // 明示的な改行のみを反映
              zIndex: 1
            }}
            dangerouslySetInnerHTML={{ __html: bottomHtml }}
          />
        </div>
        
        {/* 中央の緑帯 - プレビュー用（テキストコンテナの外に配置） */}
        <div 
          className="green-area"
          style={{
            position: 'absolute',
            top: `${redAreaTop * scaleFactor}px`,
            left: "0",
            width: "100%",
            height: `${redAreaHeight * scaleFactor}px`,
            backgroundColor: '#90EE90', // 薄い緑色
            zIndex: 0
          }} 
        >
          {/* 緑領域の中央に仮のテキスト */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ここに画像が入ります
          </div>
        </div>
      </div>
    );
  };

  // 設定パネル表示切り替え関数
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  return (
    <div className="flex flex-row gap-4 p-4">
      <div className="flex flex-col w-1/2 gap-4">
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
      <div className="w-1/2 flex items-center justify-center">
        <div
          className="border rounded bg-white overflow-hidden"
          style={{ 
            width: "360px", 
            height: "640px", 
            maxWidth: "100%", 
            aspectRatio: "9 / 16", 
            position: "relative" 
          }}
        >
          <MobilArea textRate={textRate} />
        </div>
      </div>
    </div>
  );
}