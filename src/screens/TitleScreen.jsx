import React from "react";

export function TitleScreen({ onNewGame, onQuit }) {
  return (
    <div className="title-screen">
      <div className="title-screen__bg" aria-hidden="true" />
      <div className="title-screen__title">
        <div className="title-screen__logo" aria-hidden="true" />
        <h1>The Indigestibles</h1>
        <p>一场关于肠道宿主的卡牌冒险</p>
      </div>
      <div className="title-screen__actions">
        <button type="button" className="title-screen__button" onClick={onNewGame}>
          新游戏
        </button>
        <button type="button" className="title-screen__button title-screen__button--ghost" onClick={onQuit}>
          退出游戏
        </button>
      </div>
    </div>
  );
}
