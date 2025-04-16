import { NextResponse } from 'next/server';
import { createCanvas, registerFont, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // リクエストデータの取得
    const data = await request.json();
    const { upperText, bottomText, timestamp, colorMap, selectedFont, fontWeight, styles } = data;
    
    console.log("選択されたフォント:", selectedFont);
    console.log("選択されたフォントウェイト:", fontWeight);
    console.log("スタイル情報:", JSON.stringify(styles, null, 2));
    
    // フォント登録
    const fontPath = path.join(process.cwd(), 'public', 'fonts');
    
    try {
      // カスタムフォントの登録
      registerFont(path.join(fontPath, 'LightNovelPOPv2.otf'), { family: 'lanobe-pop' });
      console.log("フォントを登録しました");
    } catch (error) {
      console.error("フォント登録エラー:", error);
    }
    
    // 出力サイズ設定（9:16のアスペクト比を維持）
    // 1080×1920 - 縦長の高解像度
    const outputWidth = 1080;
    const outputHeight = 1920;
    
    // プレビューサイズ（元のスタイル値）
    const previewWidth = styles.width;
    const previewHeight = styles.height;
    
    // スケーリング係数を計算
    const scaleX = outputWidth / previewWidth;
    const scaleY = outputHeight / previewHeight;
    
    // キャンバスの作成
    const canvas = createCanvas(outputWidth, outputHeight);
    const ctx = canvas.getContext('2d');
    
    // キャンバスを透明に設定
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    
    // フォント設定を正確に行う
    let fontFamily = selectedFont || styles.fontFamily;
    
    // 特殊フォント名の場合はシステムフォントにフォールバック
    if (fontFamily === 'lanobe-pop') {
      fontFamily = '"lanobe-pop", sans-serif';
    } else if (fontFamily === 'hiragino') {
      fontFamily = '"Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", sans-serif';
    } else if (fontFamily === 'yuji-syuku') {
      fontFamily = '"Yuji Syuku", serif';
    } else if (fontFamily === 'rampart-one') {
      fontFamily = '"Rampart One", cursive';
    }
    
    // フォントサイズとウェイトの設定
    const fontSize = styles.fontSize * scaleX;
    const fontWeightValue = fontWeight || styles.fontWeight || 400;
    const lineHeight = styles.lineHeight || 1.6;
    
    // HTMLのマークアップを色情報を保持したセグメントに変換
    const parseMarkup = (text) => {
      // <br>タグを改行文字に変換
      text = text.replace(/<br>/g, '\n');
      
      const segments = [];
      
      // 色付きテキストを検出して処理
      const regex = /<([a-z]+)>(.*?)<\/\1>/g;
      let match;
      let lastIndex = 0;
      
      while ((match = regex.exec(text)) !== null) {
        // マッチ前のテキストを追加
        if (match.index > lastIndex) {
          const plainText = text.substring(lastIndex, match.index);
          if (plainText) {
            segments.push({ text: plainText, color: '#000000' });
          }
        }
        
        // 色情報とテキストを追加
        const color = colorMap[match[1].toLowerCase()] || '#000000';
        segments.push({ text: match[2], color: color });
        
        lastIndex = match.index + match[0].length;
      }
      
      // 残りのテキストを追加
      if (lastIndex < text.length) {
        segments.push({ text: text.substring(lastIndex), color: '#000000' });
      }
      
      return segments;
    };
    
    // テキストを描画する関数（行分割と幅を考慮）
    const drawWrappedColorText = (segments, x, y, maxWidth) => {
      // フォント設定
      ctx.font = `${fontWeightValue} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      
      // 各行のデータを格納する配列
      const lines = [];
      let currentLine = [];
      let currentWidth = 0;
      
      // セグメントを行に分割
      for (const segment of segments) {
        // 改行を含むセグメントを処理
        if (segment.text.includes('\n')) {
          const parts = segment.text.split('\n');
          
          // 最初の部分を現在の行に追加
          if (parts[0]) {
            const partWidth = ctx.measureText(parts[0]).width;
            if (currentWidth + partWidth <= maxWidth) {
              currentLine.push({ text: parts[0], color: segment.color });
              currentWidth += partWidth;
            } else {
              // 幅を超える場合は新しい行に
              if (currentLine.length > 0) lines.push(currentLine);
              currentLine = [{ text: parts[0], color: segment.color }];
              currentWidth = partWidth;
            }
          }
          
          // 残りの部分は新しい行に
          for (let i = 1; i < parts.length; i++) {
            // 現在の行を追加
            if (currentLine.length > 0) lines.push(currentLine);
            
            // 新しい行を開始
            if (parts[i]) {
              currentLine = [{ text: parts[i], color: segment.color }];
              currentWidth = ctx.measureText(parts[i]).width;
            } else {
              currentLine = [];
              currentWidth = 0;
            }
          }
        } else {
          // 改行なしの通常テキスト
          const segmentWidth = ctx.measureText(segment.text).width;
          
          // 行の幅を超える場合
          if (currentWidth + segmentWidth > maxWidth) {
            // まず現在の行を保存
            if (currentLine.length > 0) {
              lines.push(currentLine);
            }
            
            // 新しい行に追加
            currentLine = [{ text: segment.text, color: segment.color }];
            currentWidth = segmentWidth;
          } else {
            // 現在の行に追加
            currentLine.push(segment);
            currentWidth += segmentWidth;
          }
        }
      }
      
      // 最後の行を追加
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      // 各行を描画
      let lineY = y;
      const lineHeightPx = fontSize * lineHeight; // 行間を設定（スタイルから取得）
      
      for (const line of lines) {
        // 行の合計幅を計算
        let lineWidth = 0;
        for (const segment of line) {
          lineWidth += ctx.measureText(segment.text).width;
        }
        
        // 行の開始位置（センタリング）
        let startX = x - lineWidth / 2;
        
        // 各セグメントを描画
        for (const segment of line) {
          ctx.fillStyle = segment.color;
          ctx.fillText(segment.text, startX + ctx.measureText(segment.text).width / 2, lineY);
          startX += ctx.measureText(segment.text).width;
        }
        
        // 次の行へ
        lineY += lineHeightPx;
      }
      
      // 実際に描画された高さを返す（後続の配置に使用）
      return lines.length * lineHeightPx;
    };
    
    // 位置をスケーリング
    const upperTextY = styles.upperTextTop * scaleY;
    const bottomTextY = outputHeight - (styles.bottomTextBottom * scaleY);
    
    // 上部テキストの解析と描画
    const upperSegments = parseMarkup(upperText);
    drawWrappedColorText(upperSegments, outputWidth / 2, upperTextY, outputWidth - (40 * scaleX));
    
    // 下部テキストの解析と描画
    const bottomSegments = parseMarkup(bottomText);
    drawWrappedColorText(bottomSegments, outputWidth / 2, bottomTextY, outputWidth - (40 * scaleX));
    
    // デバッグ情報
    console.log("出力サイズ:", outputWidth, "x", outputHeight);
    console.log("スケーリング係数:", scaleX, scaleY);
    console.log("フォントサイズ:", fontSize);
    console.log("行間設定:", lineHeight);
    console.log("上部テキスト位置:", upperTextY);
    console.log("下部テキスト位置:", bottomTextY);
    
    // PNG画像として出力
    const buffer = canvas.toBuffer('image/png');
    
    // 結果を返す
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="text_image_${timestamp}.png"`
      }
    });
  } catch (error) {
    console.error('画像生成エラー:', error);
    return NextResponse.json(
      { error: '画像の生成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}