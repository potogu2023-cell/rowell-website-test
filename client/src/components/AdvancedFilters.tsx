import { useState, useRef, useEffect } from 'react';

export interface AdvancedFiltersState {
  particleSizeMin?: number;
  particleSizeMax?: number;
  poreSizeMin?: number;
  poreSizeMax?: number;
  columnLengthMin?: number;
  columnLengthMax?: number;
  innerDiameterMin?: number;
  innerDiameterMax?: number;
  phaseTypes?: string[];
  phMin?: number;
  phMax?: number;
}

interface AdvancedFiltersProps {
  initialFilters?: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  onClose: () => void;
}

const COMMON_PARTICLE_SIZES = [1.7, 1.8, 1.9, 2.5, 2.7, 3, 5, 10];
const COMMON_PORE_SIZES = [60, 80, 100, 120, 200, 300];
const COMMON_PHASE_TYPES = ['C18', 'C8', 'C4', 'Phenyl', 'CN', 'NH2', 'Silica', 'HILIC'];
const COMMON_COLUMN_LENGTHS = [30, 50, 75, 100, 150, 250];
const COMMON_INNER_DIAMETERS = [1.0, 2.1, 3.0, 4.6];

export function AdvancedFilters({ initialFilters = {}, onFiltersChange, onClose }: AdvancedFiltersProps) {
  // 使用单独的状态变量而不是一个大对象
  const [particleSizeMin, setParticleSizeMin] = useState<string>(initialFilters.particleSizeMin?.toString() || '');
  const [particleSizeMax, setParticleSizeMax] = useState<string>(initialFilters.particleSizeMax?.toString() || '');
  const [poreSizeMin, setPoreSizeMin] = useState<string>(initialFilters.poreSizeMin?.toString() || '');
  const [poreSizeMax, setPoreSizeMax] = useState<string>(initialFilters.poreSizeMax?.toString() || '');
  const [columnLengthMin, setColumnLengthMin] = useState<string>(initialFilters.columnLengthMin?.toString() || '');
  const [columnLengthMax, setColumnLengthMax] = useState<string>(initialFilters.columnLengthMax?.toString() || '');
  const [innerDiameterMin, setInnerDiameterMin] = useState<string>(initialFilters.innerDiameterMin?.toString() || '');
  const [innerDiameterMax, setInnerDiameterMax] = useState<string>(initialFilters.innerDiameterMax?.toString() || '');
  const [selectedPhaseTypes, setSelectedPhaseTypes] = useState<string[]>(initialFilters.phaseTypes || []);
  const [phMin, setPhMin] = useState<string>(initialFilters.phMin?.toString() || '');
  const [phMax, setPhMax] = useState<string>(initialFilters.phMax?.toString() || '');
  
  const applyButtonRef = useRef<HTMLButtonElement>(null);

  const handleApply = () => {
    console.log('[AdvancedFilters] handleApply called!');
    console.log('[AdvancedFilters] particleSizeMin:', particleSizeMin);
    const filters: AdvancedFiltersState = {};
    
    if (particleSizeMin) filters.particleSizeMin = Number(particleSizeMin);
    if (particleSizeMax) filters.particleSizeMax = Number(particleSizeMax);
    if (poreSizeMin) filters.poreSizeMin = Number(poreSizeMin);
    if (poreSizeMax) filters.poreSizeMax = Number(poreSizeMax);
    if (columnLengthMin) filters.columnLengthMin = Number(columnLengthMin);
    if (columnLengthMax) filters.columnLengthMax = Number(columnLengthMax);
    if (innerDiameterMin) filters.innerDiameterMin = Number(innerDiameterMin);
    if (innerDiameterMax) filters.innerDiameterMax = Number(innerDiameterMax);
    if (selectedPhaseTypes.length > 0) filters.phaseTypes = selectedPhaseTypes;
    if (phMin) filters.phMin = Number(phMin);
    if (phMax) filters.phMax = Number(phMax);

    onFiltersChange(filters);
    onClose();
  };

  const handleReset = () => {
    setParticleSizeMin('');
    setParticleSizeMax('');
    setPoreSizeMin('');
    setPoreSizeMax('');
    setColumnLengthMin('');
    setColumnLengthMax('');
    setInnerDiameterMin('');
    setInnerDiameterMax('');
    setSelectedPhaseTypes([]);
    setPhMin('');
    setPhMax('');
  };

  const togglePhaseType = (type: string) => {
    setSelectedPhaseTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">高级筛选</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Particle Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粒径 (Particle Size) - µm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最小值</label>
                <select
                  value={particleSizeMin}
                  onChange={(e) => setParticleSizeMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_PARTICLE_SIZES.map(size => (
                    <option key={size} value={size}>{size} µm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大值</label>
                <select
                  value={particleSizeMax}
                  onChange={(e) => setParticleSizeMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_PARTICLE_SIZES.map(size => (
                    <option key={size} value={size}>{size} µm</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pore Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              孔径 (Pore Size) - Å
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最小值</label>
                <select
                  value={poreSizeMin}
                  onChange={(e) => setPoreSizeMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_PORE_SIZES.map(size => (
                    <option key={size} value={size}>{size} Å</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大值</label>
                <select
                  value={poreSizeMax}
                  onChange={(e) => setPoreSizeMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_PORE_SIZES.map(size => (
                    <option key={size} value={size}>{size} Å</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Column Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              柱长 (Column Length) - mm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最小值</label>
                <select
                  value={columnLengthMin}
                  onChange={(e) => setColumnLengthMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_COLUMN_LENGTHS.map(length => (
                    <option key={length} value={length}>{length} mm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大值</label>
                <select
                  value={columnLengthMax}
                  onChange={(e) => setColumnLengthMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_COLUMN_LENGTHS.map(length => (
                    <option key={length} value={length}>{length} mm</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inner Diameter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内径 (Inner Diameter) - mm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最小值</label>
                <select
                  value={innerDiameterMin}
                  onChange={(e) => setInnerDiameterMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_INNER_DIAMETERS.map(diameter => (
                    <option key={diameter} value={diameter}>{diameter} mm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大值</label>
                <select
                  value={innerDiameterMax}
                  onChange={(e) => setInnerDiameterMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">不限</option>
                  {COMMON_INNER_DIAMETERS.map(diameter => (
                    <option key={diameter} value={diameter}>{diameter} mm</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Phase Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              填料类型 (Phase Type)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PHASE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => togglePhaseType(type)}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    selectedPhaseTypes.includes(type)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* pH Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              pH范围
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最小pH</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={phMin}
                  onChange={(e) => setPhMin(e.target.value)}
                  placeholder="0-14"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大pH</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={phMax}
                  onChange={(e) => setPhMax(e.target.value)}
                  placeholder="0-14"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            重置
          </button>
          <button
            ref={applyButtonRef}
            onClick={handleApply}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  );
}

