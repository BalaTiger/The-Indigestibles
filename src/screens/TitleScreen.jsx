import React from "react";

export function TitleScreen({ onNewGame, onQuit }) {
  return (
    <div className="title-screen">
      <div className="title-screen__bg" aria-hidden="true" />
      <div className="title-screen__group">
        <img className="title-screen__title" src="/img/mainTitle.png" alt="The Indigestibles" />
        <div className="title-screen__actions">
          <button type="button" className="title-screen__button" onClick={onNewGame}>
            <img src="/img/newGameBtn.png" alt="新游戏" />
          </button>
          <button type="button" className="title-screen__button" onClick={onQuit}>
            <img src="/img/exitGameBtn.png" alt="退出游戏" />
          </button>
        </div>
      </div>
    </div>
  );
}
