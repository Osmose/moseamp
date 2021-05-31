import React from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ visible, onDismiss, children }) {
  const modalContainer = (
    <div className="modal-container" data-visible={visible} onClick={() => onDismiss()}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContainer, document.querySelector('#modals'));
}
