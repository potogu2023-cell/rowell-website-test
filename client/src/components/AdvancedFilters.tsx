import React, { useState } from 'react';

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
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  onClose: () => void;
}

const COMMON_PARTICLE_SIZES = [1.7, 1.8, 1.9, 2.5, 2.7, 3, 5, 10];
const COMMON_PORE_SIZES = [60, 80, 100, 120, 200, 300];
const COMMON_PHASE_TYPES = ['C18', 'C8', 'C4', 'Phenyl', 'CN', 'NH2', 'Silica', 'HILIC'];
const COMMON_COLUMN_LENGTHS = [30, 50, 75, 100, 150, 250];
const COMMON_INNER_DIAMETERS = [1.0, 2.1, 3.0, 4.6];

export function AdvancedFilters({ onFiltersChange, onClose }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFiltersState>({});
  const [selectedPhaseTypes, setSelectedPhaseTypes] = useState<string[]>([]);

  const handleApply = () => {
    onFiltersChange({
      ...filters,
      phaseTypes: selectedPhaseTypes.length > 0 ? selectedPhaseTypes : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    setSelectedPhaseTypes([]);
    onFiltersChange({});
  };

  const togglePhaseType = (phaseType: string) => {
    setSelectedPhaseTypes(prev =>
      prev.includes(phaseType)
        ? prev.filter(t => t !== phaseType)
        : [...prev, phaseType]
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
                  value={filters.particleSizeMin || ''}
                  onChange={(e) => setFilters({ ...filters, particleSizeMin: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.particleSizeMax || ''}
                  onChange={(e) => setFilters({ ...filters, particleSizeMax: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.poreSizeMin || ''}
                  onChange={(e) => setFilters({ ...filters, poreSizeMin: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.poreSizeMax || ''}
                  onChange={(e) => setFilters({ ...filters, poreSizeMax: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.columnLengthMin || ''}
                  onChange={(e) => setFilters({ ...filters, columnLengthMin: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.columnLengthMax || ''}
                  onChange={(e) => setFilters({ ...filters, columnLengthMax: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.innerDiameterMin || ''}
                  onChange={(e) => setFilters({ ...filters, innerDiameterMin: e.target.value ? Number(e.target.value) : undefined })}
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
                  value={filters.innerDiameterMax || ''}
                  onChange={(e) => setFilters({ ...filters, innerDiameterMax: e.target.value ? Number(e.target.value) : undefined })}
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
              {COMMON_PHASE_TYPES.map(phaseType => (
                <button
                  key={phaseType}
                  onClick={() => togglePhaseType(phaseType)}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    selectedPhaseTypes.includes(phaseType)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {phaseType}
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
                  value={filters.phMin || ''}
                  onChange={(e) => setFilters({ ...filters, phMin: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0-14"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大pH</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={filters.phMax || ''}
                  onChange={(e) => setFilters({ ...filters, phMax: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0-14"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            重置
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  );
}

