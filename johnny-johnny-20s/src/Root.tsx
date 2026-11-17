import React from 'react';
import {Composition} from 'remotion';
import {JohnnyScene} from './Scene';

export const RemotionRoot: React.FC = () => (
  <Composition id="JohnnyJohnny" component={JohnnyScene} durationInFrames={600} fps={30} width={1920} height={1080} />
);
