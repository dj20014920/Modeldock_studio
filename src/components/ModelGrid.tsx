
import React from 'react';
import { ActiveModel } from '../types';
import { SUPPORTED_MODELS } from '../constants';
import { ModelCard } from './ModelCard';
import { clsx } from 'clsx';

interface ModelGridProps {
  activeModels: ActiveModel[];
  mainBrainInstanceId: string | null;
  onSetMainBrain: (instanceId: string) => void;
  onCloseInstance: (instanceId: string) => void;
}

export const ModelGrid: React.FC<ModelGridProps> = ({
  activeModels,
  mainBrainInstanceId,
  onSetMainBrain,
  onCloseInstance
}) => {
  // Filter out the main brain instance from the grid
  const gridModels = activeModels.filter(m => m.instanceId !== mainBrainInstanceId);
  const count = gridModels.length;

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 flex-col gap-3 animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-xl bg-slate-200/50" />
        <p className="text-sm font-medium">All active models are in Main Brain view</p>
      </div>
    );
  }

  /**
   * 🧠 Vertical Smart Flow Grid
   */
  const getSmartGridLayout = () => {
    // CASE 1: Sidebar Mode (Main Brain is Active) -> Responsive Grid
    if (mainBrainInstanceId) {
      return {
        containerClass: '',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gridAutoRows: 'minmax(300px, 1fr)',
          alignContent: 'start',
        },
        getItemClass: () => 'h-full'
      };
    }

    // CASE 2: Single Model -> Full Screen
    if (count === 1) {
      return {
        containerClass: 'grid-cols-1 grid-rows-1',
        style: {},
        getItemClass: () => 'col-span-1 row-span-1 h-full'
      };
    }

    // CASE 3: Two Models -> Side by Side (Standard preference)
    if (count === 2) {
      return {
        containerClass: 'grid-cols-2 grid-rows-1',
        style: {},
        getItemClass: () => 'col-span-1 row-span-1 h-full'
      };
    }

    // CASE 4: 3+ Models (Responsive Smart Grid)
    // Dynamically adds rows based on available width (min-width: 320px)
    return {
      containerClass: '',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gridAutoRows: 'minmax(400px, 1fr)',
      },
      getItemClass: () => 'h-full'
    };
  };

  const layout = getSmartGridLayout();

  return (
    <div
      className={clsx(
        "w-full h-full grid bg-slate-200 gap-px overflow-auto",
        layout.containerClass
      )}
      style={layout.style}
    >
      {gridModels.map((activeModel) => {
        const modelConfig = SUPPORTED_MODELS[activeModel.modelId];
        const itemSpanClass = layout.getItemClass();

        return (
          <div
            key={activeModel.instanceId}
            className={clsx(
              "relative transition-all duration-300 ease-in-out min-h-0 min-w-0",
              itemSpanClass
            )}
          >
            <ModelCard
              model={modelConfig}
              instanceId={activeModel.instanceId}
              onSetMainBrain={() => onSetMainBrain(activeModel.instanceId)}
              onClose={() => onCloseInstance(activeModel.instanceId)}
              status={activeModel.lastStatus}
            />
          </div>
        );
      })}
    </div>
  );
};
