import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  productTypes?: string[];
  phMin?: number;
  phMax?: number;
}

interface FilterOption {
  value: string;
  count: number;
}

interface AdvancedFiltersProps {
  initialFilters?: AdvancedFiltersState;
  productTypeOptions?: FilterOption[];
  phaseTypeOptions?: FilterOption[];
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  onClose: () => void;
}

const COMMON_PARTICLE_SIZES = [1.7, 1.8, 1.9, 2.5, 2.7, 3, 5, 10];
const COMMON_PORE_SIZES = [60, 80, 100, 120, 200, 300];
const COMMON_COLUMN_LENGTHS = [30, 50, 75, 100, 150, 250];
const COMMON_INNER_DIAMETERS = [1.0, 2.1, 3.0, 4.6];

export function AdvancedFilters({
  initialFilters = {},
  productTypeOptions = [],
  phaseTypeOptions = [],
  onFiltersChange,
  onClose,
}: AdvancedFiltersProps) {
  const { t } = useTranslation();
  // 使用单独的状态变量而不是一个大对象
  const [particleSizeMin, setParticleSizeMin] = useState<string>(initialFilters.particleSizeMin?.toString() || '');
  const [particleSizeMax, setParticleSizeMax] = useState<string>(initialFilters.particleSizeMax?.toString() || '');
  const [poreSizeMin, setPoreSizeMin] = useState<string>(initialFilters.poreSizeMin?.toString() || '');
  const [poreSizeMax, setPoreSizeMax] = useState<string>(initialFilters.poreSizeMax?.toString() || '');
  const [columnLengthMin, setColumnLengthMin] = useState<string>(initialFilters.columnLengthMin?.toString() || '');
  const [columnLengthMax, setColumnLengthMax] = useState<string>(initialFilters.columnLengthMax?.toString() || '');
  const [innerDiameterMin, setInnerDiameterMin] = useState<string>(initialFilters.innerDiameterMin?.toString() || '');
  const [innerDiameterMax, setInnerDiameterMax] = useState<string>(initialFilters.innerDiameterMax?.toString() || '');
  const [phMin, setPhMin] = useState<string>(initialFilters.phMin?.toString() || '');
  const [phMax, setPhMax] = useState<string>(initialFilters.phMax?.toString() || '');
  const [productTypes, setProductTypes] = useState<string[]>(initialFilters.productTypes || []);
  const [phaseTypes, setPhaseTypes] = useState<string[]>(initialFilters.phaseTypes || []);
  const [validationError, setValidationError] = useState<string>('');
  
  const applyButtonRef = useRef<HTMLButtonElement>(null);

  const handleApply = () => {
    const filters: AdvancedFiltersState = {};
    const ranges: Array<[string, string, string]> = [
      ['Particle size', particleSizeMin, particleSizeMax],
      ['Pore size', poreSizeMin, poreSizeMax],
      ['Column length', columnLengthMin, columnLengthMax],
      ['Inner diameter', innerDiameterMin, innerDiameterMax],
      ['pH', phMin, phMax],
    ];
    const invalidRange = ranges.find(([, min, max]) => min !== '' && max !== '' && Number(min) > Number(max));
    if (invalidRange) {
      setValidationError(`${invalidRange[0]} minimum cannot exceed its maximum.`);
      return;
    }
    const invalidPh = [phMin, phMax].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 14));
    if (invalidPh) {
      setValidationError('pH values must be between 0 and 14.');
      return;
    }
    setValidationError('');
    
    if (particleSizeMin) filters.particleSizeMin = Number(particleSizeMin);
    if (particleSizeMax) filters.particleSizeMax = Number(particleSizeMax);
    if (poreSizeMin) filters.poreSizeMin = Number(poreSizeMin);
    if (poreSizeMax) filters.poreSizeMax = Number(poreSizeMax);
    if (columnLengthMin) filters.columnLengthMin = Number(columnLengthMin);
    if (columnLengthMax) filters.columnLengthMax = Number(columnLengthMax);
    if (innerDiameterMin) filters.innerDiameterMin = Number(innerDiameterMin);
    if (innerDiameterMax) filters.innerDiameterMax = Number(innerDiameterMax);
    if (phMin) filters.phMin = Number(phMin);
    if (phMax) filters.phMax = Number(phMax);
    if (productTypes.length > 0) filters.productTypes = productTypes;
    if (phaseTypes.length > 0) filters.phaseTypes = phaseTypes;

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
    setPhMin('');
    setPhMax('');
    setProductTypes([]);
    setPhaseTypes([]);
    setValidationError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t("products.advanced_filters")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {productTypeOptions.length > 0 && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">Product Type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {productTypeOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={productTypes.includes(option.value)}
                      onChange={(event) => setProductTypes((current) => event.target.checked
                        ? [...current, option.value]
                        : current.filter((value) => value !== option.value))}
                    />
                    <span>{option.value} ({option.count})</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {phaseTypeOptions.length > 0 && (
            <fieldset>
              <details>
                <summary className="cursor-pointer text-sm font-medium text-gray-700">Stationary Phase ({phaseTypeOptions.length})</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {phaseTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={phaseTypes.includes(option.value)}
                        onChange={(event) => setPhaseTypes((current) => event.target.checked
                          ? [...current, option.value]
                          : current.filter((value) => value !== option.value))}
                      />
                      <span>{option.value} ({option.count})</span>
                    </label>
                  ))}
                </div>
              </details>
            </fieldset>
          )}

          {/* Particle Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("products.particle_size")} (Particle Size) - µm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.min_value") || "Min"}</label>
                <select
                  value={particleSizeMin}
                  onChange={(e) => setParticleSizeMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
                  {COMMON_PARTICLE_SIZES.map(size => (
                    <option key={size} value={size}>{size} µm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.max_value") || "Max"}</label>
                <select
                  value={particleSizeMax}
                  onChange={(e) => setParticleSizeMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
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
              {t("products.pore_size")} (Pore Size) - Å
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.min_value") || "Min"}</label>
                <select
                  value={poreSizeMin}
                  onChange={(e) => setPoreSizeMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
                  {COMMON_PORE_SIZES.map(size => (
                    <option key={size} value={size}>{size} Å</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.max_value") || "Max"}</label>
                <select
                  value={poreSizeMax}
                  onChange={(e) => setPoreSizeMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
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
              {t("products.column_length") || "Column Length"} - mm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.min_value") || "Min"}</label>
                <select
                  value={columnLengthMin}
                  onChange={(e) => setColumnLengthMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
                  {COMMON_COLUMN_LENGTHS.map(length => (
                    <option key={length} value={length}>{length} mm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.max_value") || "Max"}</label>
                <select
                  value={columnLengthMax}
                  onChange={(e) => setColumnLengthMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
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
              {t("products.inner_diameter") || "Inner Diameter"} - mm
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.min_value") || "Min"}</label>
                <select
                  value={innerDiameterMin}
                  onChange={(e) => setInnerDiameterMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
                  {COMMON_INNER_DIAMETERS.map(diameter => (
                    <option key={diameter} value={diameter}>{diameter} mm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.max_value") || "Max"}</label>
                <select
                  value={innerDiameterMax}
                  onChange={(e) => setInnerDiameterMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("products.no_limit") || "No Limit"}</option>
                  {COMMON_INNER_DIAMETERS.map(diameter => (
                    <option key={diameter} value={diameter}>{diameter} mm</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* pH Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("products.ph_range") || "pH Range"}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("products.min_ph") || "Min pH"}</label>
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
                <label className="block text-xs text-gray-500 mb-1">{t("products.max_ph") || "Max pH"}</label>
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
          {validationError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            ref={applyButtonRef}
            onClick={handleApply}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

