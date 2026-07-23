import React, { useState, useEffect } from 'react';

// ==========================================
// 1. 类型定义 (Types & Interfaces)
// ==========================================
export interface ClientEntry {
  clientName: string;
  orderNo: string;
  partDescription: string;
  pcsLoaded: number | string;
  verifiedPcs?: number | string;
}

export interface SkidEntry {
  pcs: number | string;
  netWeight: number | string;
  location: string;
}

export interface GalvanizingRecord {
  whitesheetNo: string;
  yellowsheetNo: string;
  rackNo: string;
  shift: string;
  clientEntries: ClientEntry[];
  hasDefect: boolean;
  defectDetails: string;
  notifySupervisor: boolean;
  supervisorEmail: string;
  // Stage logs
  stageOperators?: Record<string, string>;
  stageNotes?: Record<string, string>;
  // Unloading specific
  unloadingOperator?: string;
  unloadingShift?: string;
  qualityStatus?: string;
  skids?: SkidEntry[];
}

const STAGES = [
  'Stage 1: Racking / Loading',
  'Stage 2: Degreasing',
  'Stage 3: Acid Pickling',
  'Stage 4: Fluxing',
  'Stage 5: Drying',
  'Stage 6: Hot-Dip Galvanizing',
  'Stage 7: Cooling / Quenching',
  'Stage 8: Inspection & Touch-up',
  'Stage 9: Unloading & Packaging',
];

// 占位子组件：中转阶段/卸货阶段缺陷挂载模块
const IntermediateDefectSection: React.FC<{ stage: string }> = ({ stage }) => (
  <div className="p-3 bg-amber-100/50 rounded text-xs text-amber-900">
    <p className="font-bold">Log defect observed at {stage}</p>
    <textarea
      rows={2}
      placeholder="Describe defects noticed prior to or during this stage..."
      className="w-full mt-2 p-2 border rounded border-amber-300 bg-white"
    />
  </div>
);

const UnloadingDefectSection: React.FC = () => (
  <div className="p-3 bg-amber-100/50 rounded text-xs text-amber-900">
    <p className="font-bold">Final Quality Defect / Discrepancy Log (Unloading)</p>
    <textarea
      rows={2}
      placeholder="Describe final surface finish issues or missing pieces..."
      className="w-full mt-2 p-2 border rounded border-amber-300 bg-white"
    />
  </div>
);

// ==========================================
// 2. 主表单组件 (Main Entry Form)
// ==========================================
export default function GalvanizingEntryForm() {
  // --- Basic Header State ---
  const [whitesheetNo, setWhitesheetNo] = useState<string>('');
  const [yellowsheetNo, setYellowsheetNo] = useState<string>('');
  const [rackNo, setRackNo] = useState<string>('');
  const [shift, setShift] = useState<string>('Morning');
  const [currentStage, setCurrentStage] = useState<string>(STAGES[0]);

  // --- Client Orders & Workpieces State ---
  const [clientEntries, setClientEntries] = useState<ClientEntry[]>([
    { clientName: '', orderNo: '', partDescription: '', pcsLoaded: '' },
  ]);

  // --- Stage 1 Defect State ---
  const [hasDefect, setHasDefect] = useState<boolean>(false);
  const [defectDetails, setDefectDetails] = useState<string>('');
  const [notifySupervisor, setNotifySupervisor] = useState<boolean>(false);
  const [supervisorEmail, setSupervisorEmail] = useState<string>('');
  const [defectPhotos, setDefectPhotos] = useState<File[]>([]);

  // --- Stages 2-8 Process Log State ---
  const [stageOperator, setStageOperator] = useState<string>('');
  const [stageNotes, setStageNotes] = useState<string>('');

  // --- Stage 9 Unloading State ---
  const [unloadingOperator, setUnloadingOperator] = useState<string>('');
  const [unloadingShift, setUnloadingShift] = useState<string>('');
  const [qualityStatus, setQualityStatus] = useState<string>('Pass');
  const [skids, setSkids] = useState<SkidEntry[]>([
    { pcs: '', netWeight: '', location: '' },
  ]);

  // --- Upstream Defect Tracking Toggle per Stage ---
  const [upstreamDefects, setUpstreamDefects] = useState<Record<string, boolean>>({});

  // --- Helpers for Active Stage Detection ---
  const getCurrentStageNumber = (): number => {
    const match = currentStage.match(/Stage (\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const isInitialLoading = getCurrentStageNumber() === 1;
  const isUnloading = getCurrentStageNumber() === 9;

  // --- LocalStorage Store Fetching ---
  const getLocalStore = (): Record<string, GalvanizingRecord> => {
    try {
      const stored = localStorage.getItem('galvanizing_records_v4');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const handleFetchRecord = () => {
    if (!whitesheetNo.trim()) {
      alert('Please enter a valid White Sheet # to fetch.');
      return;
    }
    const store = getLocalStore();
    const record = store[whitesheetNo.trim()];
    if (record) {
      setYellowsheetNo(record.yellowsheetNo || '');
      setRackNo(record.rackNo || '');
      setShift(record.shift || 'Morning');
      setClientEntries(record.clientEntries || []);
      setHasDefect(record.hasDefect || false);
      setDefectDetails(record.defectDetails || '');
      setNotifySupervisor(record.notifySupervisor || false);
      setSupervisorEmail(record.supervisorEmail || '');
      alert(`Record for White Sheet #${whitesheetNo} loaded successfully!`);
    } else {
      alert(`No record found for White Sheet #${whitesheetNo}.`);
    }
  };

  // --- Dynamic Handlers for Client Entries ---
  const addClientEntry = () => {
    setClientEntries((prev) => [
      ...prev,
      { clientName: '', orderNo: '', partDescription: '', pcsLoaded: '' },
    ]);
  };

  const removeClientEntry = (index: number) => {
    setClientEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateClientEntry = (
    index: number,
    field: keyof ClientEntry,
    value: string | number
  ) => {
    setClientEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // --- Dynamic Handlers for Skid Entries ---
  const addSkidEntry = () => {
    setSkids((prev) => [...prev, { pcs: '', netWeight: '', location: '' }]);
  };

  const removeSkidEntry = (index: number) => {
    setSkids((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSkidEntry = (
    index: number,
    field: keyof SkidEntry,
    value: string | number
  ) => {
    setSkids((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // --- File Upload Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDefectPhotos(Array.from(e.target.files));
    }
  };

  // --- Calculation Helpers ---
  const getRackLoadedTotalPcs = (): number => {
    return clientEntries.reduce(
      (sum, item) => sum + (Number(item.pcsLoaded) || 0),
      0
    );
  };

  const getTotalSkidPcs = (): number => {
    return skids.reduce((sum, skid) => sum + (Number(skid.pcs) || 0), 0);
  };

  const getTotalSkidNetWeight = (): number => {
    return skids.reduce((sum, skid) => sum + (Number(skid.netWeight) || 0), 0);
  };

  // --- Upstream Defect Toggle Helpers ---
  const hasCurrentStageDefect = (): boolean => {
    return !!upstreamDefects[currentStage];
  };

  const handleCurrentStageDefectToggle = (checked: boolean) => {
    setUpstreamDefects((prev) => ({ ...prev, [currentStage]: checked }));
  };

  // --- Submit Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!whitesheetNo.trim()) {
      alert('Please enter a valid White Sheet # before saving.');
      return;
    }

    const localStore = getLocalStore();

    if (isInitialLoading) {
      // Stage 1 - Create or overwrite base batch record
      const newRecord: GalvanizingRecord = {
        whitesheetNo: whitesheetNo.trim(),
        yellowsheetNo,
        rackNo,
        shift,
        clientEntries,
        hasDefect,
        defectDetails,
        notifySupervisor,
        supervisorEmail,
      };
      localStore[whitesheetNo.trim()] = newRecord;
      localStorage.setItem('galvanizing_records_v4', JSON.stringify(localStore));
      alert(`Batch Record ${whitesheetNo} created successfully!`);
    } else {
      // Stages 2-9 - Update existing record
      const existingRecord = localStore[whitesheetNo.trim()] || {
        whitesheetNo: whitesheetNo.trim(),
        yellowsheetNo,
        rackNo,
        shift,
        clientEntries,
        hasDefect: false,
        defectDetails: '',
        notifySupervisor: false,
        supervisorEmail: '',
      };

      const stageOperators = existingRecord.stageOperators || {};
      const stageNotesMap = existingRecord.stageNotes || {};

      if (stageOperator) stageOperators[currentStage] = stageOperator;
      if (stageNotes) stageNotesMap[currentStage] = stageNotes;

      const updatedRecord: GalvanizingRecord = {
        ...existingRecord,
        stageOperators,
        stageNotes: stageNotesMap,
        ...(isUnloading && {
          unloadingOperator,
          unloadingShift,
          qualityStatus,
          skids,
        }),
      };

      localStore[whitesheetNo.trim()] = updatedRecord;
      localStorage.setItem('galvanizing_records_v4', JSON.stringify(localStore));
      alert(`Status for ${currentStage} saved successfully!`);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {/* 表单卡片容器 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black tracking-wide text-blue-400 uppercase">
              Hot-Dip Galvanizing Production Log
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-Stage Tracking & Defect Management System
            </p>
          </div>

          {/* Stage 切换选择框 */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-slate-400">Current Stage:</span>
            <select
              value={currentStage}
              onChange={(e) => setCurrentStage(e.target.value)}
              className="bg-slate-800 text-white font-bold text-sm px-3 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. 基础单号与工架信息 Header */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  White Sheet #
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    placeholder="e.g. WS-9081"
                    value={whitesheetNo}
                    onChange={(e) => setWhitesheetNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {!isInitialLoading && (
                    <button
                      type="button"
                      onClick={handleFetchRecord}
                      className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md hover:bg-slate-700"
                    >
                      Fetch
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Yellow Sheet #
                </label>
                <input
                  type="text"
                  disabled={!isInitialLoading}
                  placeholder="e.g. YS-4410"
                  value={yellowsheetNo}
                  onChange={(e) => setYellowsheetNo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                    isInitialLoading ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-slate-200 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Rack # / Station
                </label>
                <input
                  type="text"
                  disabled={!isInitialLoading}
                  placeholder="e.g. R-12"
                  value={rackNo}
                  onChange={(e) => setRackNo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                    isInitialLoading ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-slate-200 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Racking Shift
                </label>
                <select
                  disabled={!isInitialLoading}
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                    isInitialLoading ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-slate-200 cursor-not-allowed'
                  }`}
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Afternoon">Afternoon Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Client Orders & Workpieces */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Client Orders & Workpieces
            </h3>

            {clientEntries.map((entry, index) => (
              <div
                key={index}
                className="p-4 border rounded-xl bg-white border-slate-200 space-y-3 relative shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Order Entry #{index + 1}
                  </span>
                  {isInitialLoading && clientEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeClientEntry(index)}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      disabled={!isInitialLoading}
                      value={entry.clientName}
                      onChange={(e) => updateClientEntry(index, 'clientName', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-xs text-slate-800 outline-none ${
                        isInitialLoading ? 'bg-white focus:ring-1 focus:ring-blue-500' : 'bg-slate-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Order / PO #
                    </label>
                    <input
                      type="text"
                      disabled={!isInitialLoading}
                      value={entry.orderNo}
                      onChange={(e) => updateClientEntry(index, 'orderNo', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-xs text-slate-800 outline-none ${
                        isInitialLoading ? 'bg-white focus:ring-1 focus:ring-blue-500' : 'bg-slate-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Part Description
                    </label>
                    <input
                      type="text"
                      disabled={!isInitialLoading}
                      value={entry.partDescription}
                      onChange={(e) => updateClientEntry(index, 'partDescription', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-xs text-slate-800 outline-none ${
                        isInitialLoading ? 'bg-white focus:ring-1 focus:ring-blue-500' : 'bg-slate-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      {isInitialLoading ? 'Pcs Loaded' : 'Verified Pcs'}
                    </label>
                    <input
                      type="number"
                      value={isInitialLoading ? entry.pcsLoaded : entry.verifiedPcs ?? entry.pcsLoaded}
                      onChange={(e) =>
                        updateClientEntry(
                          index,
                          isInitialLoading ? 'pcsLoaded' : 'verifiedPcs',
                          e.target.value
                        )
                      }
                      className="w-full px-2.5 py-1.5 border rounded text-xs font-bold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            {isInitialLoading && (
              <button
                type="button"
                onClick={addClientEntry}
                className="w-full py-3 border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-sm rounded-lg transition flex justify-center items-center space-x-2"
              >
                <span>+ Add Another Client / Order to this Rack</span>
              </button>
            )}
          </div>

          {/* 3. Defect Marking (Stage 1 / Racking Only) */}
          {isInitialLoading && (
            <div className="p-4 border rounded-lg bg-red-50/50 border-red-200 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDefect}
                  onChange={(e) => setHasDefect(e.target.checked)}
                  className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="font-bold text-red-700 text-sm">
                  Flag Quality Defect / Pre-existing Damage
                </span>
              </label>

              {hasDefect && (
                <div className="space-y-3 pt-2 border-t border-red-200 mt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-red-800 mb-1">
                      Defect Details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe pre-existing damage or surface defect..."
                      value={defectDetails}
                      onChange={(e) => setDefectDetails(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-md text-slate-800 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                    />
                  </div>

                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifySupervisor}
                      onChange={(e) => setNotifySupervisor(e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span>Send Email Alert to Supervisor</span>
                  </label>

                  {/* 主管邮箱输入框 */}
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
                      Supervisor Email Address
                    </label>
                    <div
                      className="mb-2 text-xs text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSupervisorEmail('ajay@ebcometalfinishing.com')}
                    >
                      Click to auto-fill: ajay@ebcometalfinishing.com
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. ajay@ebcometalfinishing.com"
                      value={supervisorEmail}
                      onChange={(e) => setSupervisorEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-md text-slate-800 outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>

                  {/* 照片上传 */}
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
                      Attach Defect Photos {defectPhotos.length > 0 && `(${defectPhotos.length} selected)`}
                    </label>
                    <label className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-700 text-sm cursor-pointer hover:bg-slate-50">
                      <span>Capture or Choose Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-bold hover:bg-blue-700 transition"
                    onClick={() => {
                      const subject = encodeURIComponent(`Defect Report - WS #${whitesheetNo}`);
                      const body = encodeURIComponent(
                        `White Sheet #: ${whitesheetNo}\nRack #: ${rackNo}\n\nDefect Details:\n${defectDetails}`
                      );
                      window.location.href = `mailto:${supervisorEmail}?subject=${subject}&body=${body}`;
                    }}
                  >
                    Send Email to Supervisor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Process Log (Stages 2-8) */}
          {!isInitialLoading && !isUnloading && (
            <div className="p-5 bg-blue-50/60 border-2 border-blue-200 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-blue-900 border-b border-blue-200 pb-2">
                Process Log for {currentStage}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">
                    Stage Operator Name
                  </label>
                  <input
                    type="text"
                    placeholder="Operator Name"
                    value={stageOperator}
                    onChange={(e) => setStageOperator(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">
                    Process Notes / Parameters
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dipping time, Temperature, Acid conc."
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Unloading & Skid Tracking Entry (Stage 9) */}
          {isUnloading && (
            <div className="p-5 bg-emerald-50/70 border-2 border-emerald-300 rounded-xl space-y-5">
              <div className="border-b border-emerald-200 pb-2 flex justify-between items-center">
                <h3 className="text-base font-bold text-emerald-900">
                  Unloading & Skid Tracking Entry
                </h3>
                <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full">
                  Total Skids: {skids.length}
                </span>
              </div>

              {/* 操作员与质量信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">
                    Unloading Operator
                  </label>
                  <input
                    type="text"
                    placeholder="Operator Name"
                    value={unloadingOperator}
                    onChange={(e) => setUnloadingOperator(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">
                    Unloading Shift
                  </label>
                  <select
                    value={unloadingShift}
                    onChange={(e) => setUnloadingShift(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="" disabled>
                      Please select shift...
                    </option>
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">
                    Quality Inspection Status
                  </label>
                  <select
                    value={qualityStatus}
                    onChange={(e) => setQualityStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Touch-up Needed">Touch-up Needed</option>
                    <option value="Rework/Acid Strip">Rework / Acid Strip</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
              </div>

              {/* 动态 Skid 列表 */}
              <div className="space-y-4 pt-2">
                <label className="block text-xs font-bold uppercase text-emerald-900">
                  Skid Breakdown (Quantity, Net Weight & Location)
                </label>

                {skids.map((skid, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                        Skid #{index + 1}
                      </span>
                      {skids.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkidEntry(index)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition"
                        >
                          Remove Skid
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Quantity (pcs)
                        </label>
                        <input
                          type="number"
                          placeholder="pcs on this skid"
                          value={skid.pcs}
                          onChange={(e) => updateSkidEntry(index, 'pcs', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Net Weight (lbs)
                        </label>
                        <input
                          type="number"
                          placeholder="lbs"
                          value={skid.netWeight}
                          onChange={(e) => updateSkidEntry(index, 'netWeight', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Storage Location / Bay
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. W-11"
                          value={skid.location}
                          onChange={(e) => updateSkidEntry(index, 'location', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* 添加 Skid 按钮 */}
                <button
                  type="button"
                  onClick={addSkidEntry}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-emerald-100/40 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs rounded-lg transition flex justify-center items-center space-x-2"
                >
                  <span>+ Add Another Skid (Skid #{skids.length + 1})</span>
                </button>
              </div>

              {/* 汇总与件数比对 */}
              <div className="bg-emerald-100/60 p-4 rounded-lg border border-emerald-300 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Total Rack Loaded (pcs)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={getRackLoadedTotalPcs()}
                    className="w-full px-3 py-2 border bg-slate-100 font-bold text-slate-700 rounded outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-bold uppercase mb-1 ${
                      getTotalSkidPcs() !== 0 && getTotalSkidPcs() !== getRackLoadedTotalPcs()
                        ? 'text-red-600'
                        : 'text-emerald-800'
                    }`}
                  >
                    Total Unloaded Skids (pcs){' '}
                    {getTotalSkidPcs() !== 0 &&
                      getTotalSkidPcs() !== getRackLoadedTotalPcs() &&
                      '⚠️ Discrepancy!'}
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={getTotalSkidPcs()}
                    className={`w-full px-3 py-2 border font-bold rounded outline-none cursor-not-allowed ${
                      getTotalSkidPcs() !== 0 && getTotalSkidPcs() !== getRackLoadedTotalPcs()
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-white text-emerald-900 border-emerald-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-900 mb-1">
                    Total Net Weight Auto Sum (lbs)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round(getTotalSkidNetWeight())}
                    className="w-full px-3 py-2 border bg-emerald-200 font-bold text-emerald-900 rounded outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 上游缺陷报告挂载点（仅在 Stage 2~9 显示） */}
          {getCurrentStageNumber() >= 2 && (
            <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="stageDefectToggle"
                  checked={hasCurrentStageDefect()}
                  onChange={(e) => handleCurrentStageDefectToggle(e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label
                  htmlFor="stageDefectToggle"
                  className="font-bold text-amber-800 text-sm cursor-pointer"
                >
                  REPORT UPSTREAM / PREVIOUS STAGE DEFECT
                </label>
              </div>

              {hasCurrentStageDefect() && (
                <div className="mt-2 pl-6 space-y-3 border-t border-amber-200 pt-3">
                  {getCurrentStageNumber() >= 2 && getCurrentStageNumber() <= 8 && (
                    <IntermediateDefectSection stage={currentStage} />
                  )}
                  {getCurrentStageNumber() === 9 && <UnloadingDefectSection />}
                </div>
              )}
            </div>
          )}

          {/* Actions / Submit Section */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white rounded-lg shadow transition bg-blue-600 hover:bg-blue-700"
            >
              {isInitialLoading
                ? 'Save & Create Batch Record'
                : isUnloading
                ? 'Complete & Close Batch Record'
                : `Save ${currentStage} Status Log`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
