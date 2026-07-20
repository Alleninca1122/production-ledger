'use client';

import { useState, useEffect } from 'react';

interface WorkpieceItem {
  type: string;
  otherType: string;
  pcs: string;          // 初始 Loading 数量
  stageVerifiedPcs?: Record<string, string>; // 按工序独立存储的复核数量
}

interface ClientEntry {
  clientName: string;
  batchNo: string;
  workpieces: WorkpieceItem[];
}

interface SkidEntry {
  pcs: string;
  netWeight: string;
  location: string;
}

interface BatchRecord {
  whitesheetNo: string;
  yellowsheetNo: string;
  rackNo: string;
  loadingOperator: string;
  loadingShift: string;
  clientEntries: ClientEntry[];
  hasDefect: boolean;
  defectDetails: string;
  notifySupervisor: boolean;
  // Unloading 扩展字段
  unloadingOperator?: string;
  unloadingShift?: string;
  qualityStatus?: string;
  skids?: SkidEntry[];
}

export default function Home() {
  const stages = [
    '1. Loading', '2. Degreasing', '3. Pickling', '4. Rinsing', 
    '5. Fluxing', '6. Drying', '7. Dipping', '8. Cooling', '9. Unloading'
  ];
  const [currentStage, setCurrentStage] = useState<string>('1. Loading');
  const [searchWhitesheet, setSearchWhitesheet] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
const [notifySupervisor, setNotifySupervisor] = useState(false);  
// 提取当前工序的数字序号（如 '9. Unloading' -> 9）
  const getCurrentStageNumber = () => {
    const match = currentStage.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  // 判断当前工序是否有缺陷
  const hasCurrentStageDefect = () => {
    return hasDefect; 
  };

  // 切换当前工序缺陷状态
  const handleCurrentStageDefectToggle = (val: any) => {
    setHasDefect(val);
  };

  // 获取当前工序缺陷标题
  const getCurrentStageDefectTitle = () => {
    return `FLAG DEFECT FOR ${currentStage.toUpperCase()}`;
  };

  // 第2-8工序的中间缺陷填写区
  function IntermediateDefectSection({ stage: any }) {
    return (
      <div className="space-y-3">
        <textarea 
          placeholder={`Describe process defects found at ${stage}...`} 
          className="w-full p-2 border border-red-300 rounded text-sm bg-white"
          rows={2}
        />
        <input type="file" accept="image/*" capture="environment" className="text-xs text-gray-600" />
      </div>
    );
  }

  // 第9工序（Unloading）的卸货缺陷填写区
  function UnloadingDefectSection() {
    return (
      <div className="space-y-3">
        <textarea 
          placeholder="Describe upstream defects found during unloading..." 
          className="w-full p-2 border border-red-300 rounded text-sm bg-white"
          rows="2"
        />
        <input type="file" accept="image/*" capture="environment" className="text-xs text-gray-600" />
      </div>
    );
  }
  // 本地存储备份
  const [localStore, setLocalStore] = useState<Record<string, BatchRecord>>({});
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log("Selected files:", files);
    }
  };
  useEffect(() => {
    const saved = localStorage.getItem('galvanizing_records_v4');
    if (saved) {
      try { setLocalStore(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // 1. Loading 数据状态
  const [whitesheetNo, setwhitesheetNo] = useState('');
  const [yellowsheetNo, setyellowsheetNo] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [loadingOperator, setLoadingOperator] = useState('');
  const [loadingShift, setLoadingShift] = useState('');

  // 动态多客户与多工件列表
  const [clientEntries, setClientEntries] = useState<ClientEntry[]>([
    { clientName: '', batchNo: '', workpieces: [{ type: '', otherType: '', pcs: '', stageVerifiedPcs: {} }] }
  ]);

  const [hasDefect, setHasDefect] = useState(false);
  const [defectDetails, setDefectDetails] = useState('');

  // 2. 中间阶段状态
  const [stageOperator, setStageOperator] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  // 3. Unloading 数据状态（ Skid 动态列表设计）
  const [unloadingOperator, setUnloadingOperator] = useState('');
  const [unloadingShift, setUnloadingShift] = useState('');
  const [qualityStatus, setQualityStatus] = useState('Pass');
  const [skids, setSkids] = useState<SkidEntry[]>([
    { pcs: '', netWeight: '', location: '' }
  ]);

  // 预设工件类型
  const workpieceTypes = [
    'Anchor', 'Angle', 'Beam', 'Bracket', 'Frame', 
    'Grating', 'Ladder', 'Mesh', 'Mixed', 'Pipe', 
    'Plate', 'Pole', 'Railing', 'Rebar', 'Rod', 
    'Tube', 'Washer', 'Others'
  ];

  // 增删客户与工件 Handlers
  const addClientEntry = () => {
    setClientEntries([...clientEntries, { clientName: '', batchNo: '', workpieces: [{ type: '', otherType: '', pcs: '', stageVerifiedPcs: {} }] }]);
  };
  const removeClientEntry = (clientIndex: number) => {
    setClientEntries(clientEntries.filter((_, idx) => idx !== clientIndex));
  };
  const updateClientInfo = (clientIndex: number, field: keyof ClientEntry, value: any) => {
    const updated = [...clientEntries];
    updated[clientIndex] = { ...updated[clientIndex], [field]: value };
    setClientEntries(updated);
  };
  const addWorkpiece = (clientIndex: number) => {
    const updated = [...clientEntries];
    updated[clientIndex].workpieces.push({ type: '', otherType: '', pcs: '', stageVerifiedPcs: {} });
    setClientEntries(updated);
  };
  const removeWorkpiece = (clientIndex: number, wpIndex: number) => {
    const updated = [...clientEntries];
    updated[clientIndex].workpieces = updated[clientIndex].workpieces.filter((_, idx) => idx !== wpIndex);
    setClientEntries(updated);
  };
  const updateWorkpiece = (clientIndex: number, wpIndex: number, field: keyof WorkpieceItem, value: string) => {
    const updated = [...clientEntries];
    updated[clientIndex].workpieces[wpIndex] = { ...updated[clientIndex].workpieces[wpIndex], [field]: value };
    setClientEntries(updated);
  };

  // 专门更新当前工序独立复核数量的函数
  const updateStageVerifiedPcs = (clientIndex: number, wpIndex: number, value: string) => {
    const updated = [...clientEntries];
    const item = updated[clientIndex].workpieces[wpIndex];
    const stageMap = { ...(item.stageVerifiedPcs || {}) };
    stageMap[currentStage] = value;
    updated[clientIndex].workpieces[wpIndex] = { ...item, stageVerifiedPcs: stageMap };
    setClientEntries(updated);
  };

  // Unloading Skid 动态控制 Handlers
  const addSkidEntry = () => {
    setSkids([...skids, { pcs: '', netWeight: '', location: '' }]);
  };
  const removeSkidEntry = (index: number) => {
    setSkids(skids.filter((_, idx) => idx !== index));
  };
  const updateSkidEntry = (index: number, field: keyof SkidEntry, value: string) => {
    const updated = [...skids];
    updated[index] = { ...updated[index], [field]: value };
    setSkids(updated);
  };

  // 自动计算汇总数量与净重
  const getRackLoadedTotalPcs = () => {
    return clientEntries.reduce((sum, client) => {
      return sum + client.workpieces.reduce((sub, item) => sub + (parseInt(item.pcs, 10) || 0), 0);
    }, 0);
  };

  const getClientTotalPcs = (client: ClientEntry) => {
    return client.workpieces.reduce((sum, item) => sum + (parseInt(item.pcs, 10) || 0), 0);
  };
  
  const getClientTotalVerifiedPcs = (client: ClientEntry) => {
    return client.workpieces.reduce((sum, item) => {
      const val = item.stageVerifiedPcs?.[currentStage] || '';
      return sum + (parseInt(val, 10) || 0);
    }, 0);
  };

  const getTotalSkidPcs = () => {
    return skids.reduce((sum, skid) => sum + (parseInt(skid.pcs, 10) || 0), 0);
  };

  const getTotalSkidNetWeight = () => {
    return skids.reduce((sum, skid) => sum + (parseFloat(skid.netWeight) || 0), 0);
  };

{/* 热浸镀锌北美行业标准视觉与物理损伤缺陷术语库 */}
  const standardGalvanizingDefects = [
    { id: "surface_contamination", label: "Surface Contamination / Marker Residue" }, // 油漆/记号笔污染拒镀
    { id: "bare_black_spots", label: "Bare Spots / Black Spots " }, // 漏镀 / 局部黑斑
    { id: "vent_pocket_residue", label: "Trapped Flux / Vent Pocket Residue " }, // 死角残留/排气不良积碳
    { id: "blistering_flaking", label: "Coating Blistering / Flaking" }, //  (镀层起泡 / 剥落露底)
    { id: "excessive_dross_tumors", label: "Excessive Dross / Zinc Tumors " }, //  锌渣夹杂 / 严重锌瘤
    { id: "surface_roughness", label: "Severe Surface Roughness " }, // 表面严重粗糙不均
    { id: "physical_deformation", label: "Physical Impact Damage / Deformation " }, // 物理撞击变形
    { id: "impact_coating_loss", label: "Impact Coating Chipping / Stripping " } // 撞击导致镀层脱落
  ];

  function UnloadingDefectSection() {
    const [flagDefect, setFlagDefect] = useState(false);
    const [sendEmailAlert, setSendEmailAlert] = useState(false);

    return (
      <div className="space-y-4 pt-3 border-t border-amber-200 mt-3">
        {/* 唯一的勾选开关 */}
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="flag_unloading_defect_direct"
            checked={flagDefect}
            onChange={(e) => setFlagDefect(e.target.checked)}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded cursor-pointer" 
          />
          <label htmlFor="flag_unloading_defect_direct" className="text-xs font-bold uppercase tracking-wider text-amber-900 cursor-pointer">
            Report Upstream Defect | Stage 9 - Unloading
          </label>
        </div>

        {flagDefect && (
          <div className="space-y-4 bg-amber-50/60 p-3.5 border border-amber-300 rounded-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1">
             DEFECT REPORTING & PHOTO EVIDENCE (STAGE 9 -  UNLOADING)
            </div>

            {clientEntries.length > 0 ? (
              clientEntries.map((client, idx) => (
                <div key={idx} className="bg-white p-3 border border-amber-300 rounded shadow-sm space-y-3">
                  <div className="text-xs font-bold tracking-wider text-blue-900 border-b border-gray-100 pb-1">
                    CLIENT ITEM #{idx + 1} &mdash; {client.clientName || "UNNAMED CLIENT"} (BATCH: {client.batchNo || "N/A"})
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-2">
                      SELECT WORKPIECE TYPE & SPECIFIC DEFECTS
                    </label>
                    
                    {client.workpieces && client.workpieces.length > 0 ? (
                      <div className="space-y-3">
                        {client.workpieces.map((wp, wpIdx) => (
                          <div key={wpIdx} className="bg-amber-50/50 p-2.5 border border-amber-200 rounded space-y-2">
                            <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 text-amber-600 border-gray-300 rounded" />
                              <span>Workpiece Type: {wp.type || "Unspecified Type"} (Loaded Pcs: {wp.pcs || 0})</span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-1">
                              {standardGalvanizingDefects.map((defect) => (
                                <label key={defect.id} className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer">
                                  <input type="checkbox" className="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded" />
                                  <span className="font-medium">{defect.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded">
                        No workpiece types defined for this client item yet.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Other Upstream Defect
                    </label>
                    <input 
                      type="text" 
                      placeholder={`Describe other upstream defect not listed above for Client Item #${idx + 1}...`} 
                      className="w-full p-2 border border-amber-200 rounded text-xs bg-gray-50"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic bg-white p-3 border border-amber-200 rounded">
                No client items added on this rack yet.
              </div>
            )}

            {/* 拍照取证区：常驻显示 */}
            <div className="bg-white p-3 border border-amber-300 rounded-md space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-800">
                ATTACH DEFECT PHOTOS
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-gray-50 cursor-pointer hover:border-amber-400">
                <input type="file" accept="image/*" capture="environment" className="hidden" id="photo_upload_unloading_clean" />
                <label htmlFor="photo_upload_unloading_clean" className="cursor-pointer text-xs text-blue-600 font-medium">
                  Capture or Choose Photos
                </label>
              </div>
            </div>

            {/* 可选的主管邮件通知区 */}
            <div className="space-y-3 pt-2 border-t border-amber-200">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="email_alert_unloading_clean"
                  checked={sendEmailAlert}
                  onChange={(e) => setSendEmailAlert(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="email_alert_unloading_clean" className="text-xs font-medium text-gray-800 cursor-pointer">
                  Send Email Alert to Supervisor (同时发送邮件通知主管)
                </label>
              </div>

              {sendEmailAlert && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-800">
                      SUPERVISOR EMAIL ADDRESS (主管邮箱)
                    </label>
                    <div 
                      className="text-xs text-blue-600 cursor-pointer hover:underline inline-block font-medium"
                      onClick={() => setSupervisorEmail("ajay@ebcometalfinishing.com")}
                    >
                      Click to auto-fill: ajay@ebcometalfinishing.com
                    </div>
                    <input 
                      type="email" 
                      placeholder="e.g. ajay@ebcometalfinishing.com" 
                      value={supervisorEmail}
                      onChange={(e) => setSupervisorEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => alert("Email sent to supervisor successfully!")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded shadow transition"
                  >
                    Send Email to Supervisor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
    // 查询记录
  const handleFetchRecord = async () => {
    const key = searchWhitesheet.trim();
    if (!key) {
      alert('Please enter a White Sheet # to search');
      return;
    }

    let targetRecord: BatchRecord | null = null;

    try {
      const res = await fetch(`/api/galvanizing/records?whitesheetNo=${key}`);
      if (res.ok) {
        targetRecord = await res.json();
      }
    } catch (e) {}

    if (!targetRecord && localStore[key]) {
      targetRecord = localStore[key];
    }

    if (targetRecord) {
      setwhitesheetNo(targetRecord.whitesheetNo);
      setyellowsheetNo(targetRecord.yellowsheetNo);
      setRackNo(targetRecord.rackNo);
      setLoadingOperator(targetRecord.loadingOperator);
      setLoadingShift(targetRecord.loadingShift);
      setClientEntries(targetRecord.clientEntries || []);
      setHasDefect(targetRecord.hasDefect);
      setDefectDetails(targetRecord.defectDetails);
      setNotifySupervisor(targetRecord.notifySupervisor);

      // 读取已有 Unloading 数据（如有）
      if (targetRecord.unloadingOperator) setUnloadingOperator(targetRecord.unloadingOperator);
      if (targetRecord.unloadingShift) setUnloadingShift(targetRecord.unloadingShift);
      if (targetRecord.qualityStatus) setQualityStatus(targetRecord.qualityStatus);
      if (targetRecord.skids && targetRecord.skids.length > 0) setSkids(targetRecord.skids);

      alert(`Record loaded successfully for ${currentStage}!`);
    } else {
      alert(`No record found for White Sheet #${key}. Please create it in Stage 1 first.`);
    }
  };

  // 提交保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStage === '1. Loading') {
      if (!whitesheetNo.trim()) {
        alert('Please enter a White Sheet # before saving.');
        return;
      }

      const newRecord: BatchRecord = {
        whitesheetNo: whitesheetNo.trim(),
        yellowsheetNo,
        rackNo,
        loadingOperator,
        loadingShift,
        clientEntries,
        hasDefect,
        defectDetails,
        notifySupervisor
      };

      const updatedStore = { ...localStore, [whitesheetNo.trim()]: newRecord };
      setLocalStore(updatedStore);
      localStorage.setItem('galvanizing_records_v4', JSON.stringify(updatedStore));

      alert(`Batch Saved Successfully!\n\nWhite Sheet #: ${whitesheetNo}`);

    } else {
      const updatedRecord: BatchRecord = {
        whitesheetNo: whitesheetNo.trim(),
        yellowsheetNo,
        rackNo,
        loadingOperator,
        loadingShift,
        clientEntries,
        hasDefect,
        defectDetails,
        notifySupervisor,
        unloadingOperator,
        unloadingShift,
        qualityStatus,
        skids
      };

      const updatedStore = { ...localStore, [whitesheetNo.trim()]: updatedRecord };
      setLocalStore(updatedStore);
      localStorage.setItem('galvanizing_records_v4', JSON.stringify(updatedStore));

      if (currentStage === '9. Unloading') {
        alert(`Unloading Completed!\n\nWhite Sheet #: ${whitesheetNo}\nTotal Skids: ${skids.length}\nTotal Net Weight: ${getTotalSkidNetWeight()} lbs`);
      } else {
        alert(`Data for [${currentStage}] saved successfully!`);
      }
    }
  };

  const isInitialLoading = currentStage === '1. Loading';
  const isUnloading = currentStage === '9. Unloading';

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-12">
      {/* Header & Stage Selector */}
      <header className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-slate-300">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Galvanizing Production Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Full 9-Stage Process Lifecycle Management</p>
        </div>

        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-300 shadow-sm">
          <label className="text-xs font-bold uppercase text-slate-600">Active Process Stage:</label>
          <select
            value={currentStage}
            onChange={(e) => setCurrentStage(e.target.value)}
            className="px-3 py-1.5 font-bold text-sm text-blue-700 bg-slate-50 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {stages.map((stg) => (
              <option key={stg} value={stg}>{stg}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Lookup Banner */}
        {!isInitialLoading && (
          <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                Lookup White Sheet # for {currentStage}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter White Sheet # (e.g. 8888)"
                  value={searchWhitesheet}
                  onChange={(e) => setSearchWhitesheet(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                />
                <button
                  type="button"
                  onClick={handleFetchRecord}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-md shadow transition"
                >
                  Fetch Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-xl font-bold text-slate-800">
              {isInitialLoading ? 'New Batch Entry (Loading)' : `Stage Tracking: ${currentStage}`}
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-800">
              Current Stage: {currentStage}
            </span>
          </div>

          {/* 1. Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">White Sheet #</label>
              <input
                type="text"
                disabled={!isInitialLoading}
                placeholder="e.g. 8888"
                value={whitesheetNo}
                onChange={(e) => setwhitesheetNo(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                  !isInitialLoading ? 'bg-slate-100 font-bold cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Yellow Sheet #</label>
              <input
                type="text"
                disabled={!isInitialLoading}
                placeholder="e.g. 865421"
                value={yellowsheetNo}
                onChange={(e) => setyellowsheetNo(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rack #</label>
              <input
                type="text"
                disabled={!isInitialLoading}
                placeholder="e.g. 12"
                value={rackNo}
                onChange={(e) => setRackNo(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Loading Operator</label>
              <input
                type="text"
                disabled={!isInitialLoading}
                placeholder="Operator Name"
                value={loadingOperator}
                onChange={(e) => setLoadingOperator(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Loading Shift</label>
              <select
                disabled={!isInitialLoading}
                value={loadingShift}
                onChange={(e) => setLoadingShift(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <option value="" disabled>Please select a shift...</option>
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
              </select>
            </div>
          </div>
          {/* 2. Dynamic Client Orders & Workpieces */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold uppercase text-slate-700 tracking-wider">
                Client Orders on Rack ({clientEntries.length})
              </h3>
            </div>

            {clientEntries.map((client, clientIndex) => {
              const loadedTotal = getClientTotalPcs(client);
              const verifiedTotal = getClientTotalVerifiedPcs(client);
              const isMismatch = !isInitialLoading && verifiedTotal !== 0 && verifiedTotal !== loadedTotal;

              return (
                <div key={clientIndex} className="bg-slate-50 p-5 rounded-lg border border-slate-300 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      Client Item #{clientIndex + 1}
                    </span>
                    {clientEntries.length > 1 && isInitialLoading && (
                      <button
                        type="button"
                        onClick={() => removeClientEntry(clientIndex)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-100/60 hover:bg-red-100 px-3 py-1 rounded transition"
                      >
                        Remove Client Order
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Client Name</label>
                      <input
                        type="text"
                        disabled={!isInitialLoading}
                        placeholder="e.g. ABC Steel"
                        value={client.clientName}
                        onChange={(e) => updateClientInfo(clientIndex, 'clientName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                          !isInitialLoading ? 'bg-slate-100 font-semibold cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Client Batch #</label>
                      <input
                        type="text"
                        disabled={!isInitialLoading}
                        placeholder="e.g. #2, #3"
                        value={client.batchNo}
                        onChange={(e) => updateClientInfo(clientIndex, 'batchNo', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-slate-800 outline-none ${
                          !isInitialLoading ? 'bg-slate-100 font-semibold cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Workpieces breakdown */}
                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <label className="block text-xs font-bold uppercase text-slate-600">
                      Workpiece Breakdown (Types & Quantities)
                    </label>

                    {client.workpieces.map((item, wpIndex) => {
                      const currentStageVerifiedVal = item.stageVerifiedPcs?.[currentStage] || '';

                      return (
                        <div key={wpIndex} className="bg-white p-3 rounded-md border space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                Workpiece Type
                              </label>
                              <select
                                disabled={!isInitialLoading}
                                value={item.type}
                                onChange={(e) => updateWorkpiece(clientIndex, wpIndex, 'type', e.target.value)}
                                className={`w-full px-3 py-1.5 border rounded text-slate-800 outline-none text-sm font-medium ${
                                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                                }`}
                              >
                                <option value="" disabled>Please select type...</option>
                                {workpieceTypes.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            <div className={isInitialLoading ? 'w-32' : 'w-28'}>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                {isInitialLoading ? 'Quantity (pcs)' : 'Loaded (pcs)'}
                              </label>
                              <input
                                type="number"
                                disabled={!isInitialLoading}
                                placeholder="0"
                                value={item.pcs}
                                onChange={(e) => updateWorkpiece(clientIndex, wpIndex, 'pcs', e.target.value)}
                                className={`w-full px-3 py-1.5 border rounded text-slate-800 outline-none text-sm font-semibold ${
                                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                                }`}
                              />
                            </div>

                            {!isInitialLoading && (
                              <div className="w-36">
                                <label className="block text-[10px] font-bold uppercase text-blue-700 mb-1">
                                  Verified (pcs)
                                </label>
                                <input
                                  type="number"
                                  placeholder="Re-count"
                                  value={currentStageVerifiedVal}
                                  onChange={(e) => updateStageVerifiedPcs(clientIndex, wpIndex, e.target.value)}
                                  className="w-full px-3 py-1.5 border-2 border-blue-400 bg-blue-50/60 rounded text-slate-900 font-bold outline-none text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            {client.workpieces.length > 1 && isInitialLoading && (
                              <button
                                type="button"
                                onClick={() => removeWorkpiece(clientIndex, wpIndex)}
                                className="mt-4 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {item.type === 'Others' && (
                            <div className="pt-1 border-t border-slate-100">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description (Optional)</label>
                              <input
                                type="text"
                                disabled={!isInitialLoading}
                                placeholder="Description (Optional)"
                                value={item.otherType}
                                onChange={(e) => updateWorkpiece(clientIndex, wpIndex, 'otherType', e.target.value)}
                                className={`w-full px-3 py-1.5 border rounded text-slate-800 outline-none text-sm ${
                                  !isInitialLoading ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-blue-500'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isInitialLoading && (
                      <button
                        type="button"
                        onClick={() => addWorkpiece(clientIndex)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 pt-1"
                      >
                        <span>+ Add Another Workpiece Type for this Client</span>
                      </button>
                    )}
                  </div>

                  {/* 底部自动汇总对比栏 */}
                  <div className="border-t border-slate-200 pt-3">
                    {isInitialLoading ? (
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          Total Quantity (pcs) Auto Sum
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={loadedTotal}
                          className="w-full px-3 py-2 border bg-slate-100 font-bold text-blue-700 rounded-md outline-none cursor-not-allowed"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                            Loaded Total (pcs)
                          </label>
                          <input
                            type="number"
                            readOnly
                            value={loadedTotal}
                            className="w-full px-3 py-1.5 border bg-slate-100 font-bold text-slate-700 rounded outline-none cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-bold uppercase mb-1 ${isMismatch ? 'text-red-600' : 'text-blue-700'}`}>
                            [{currentStage}] Verified Total (pcs) {isMismatch && '⚠️ Discrepancy!'}
                          </label>
                          <input
                            type="number"
                            readOnly
                            value={verifiedTotal}
                            className={`w-full px-3 py-1.5 border font-bold rounded outline-none cursor-not-allowed ${
                              isMismatch 
                                ? 'bg-red-50 text-red-700 border-red-300' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

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

          {/* 3. Defect Marking */}
          {isInitialLoading && (
            <div className="p-4 border rounded-lg bg-red-50/50 border-red-200 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDefect}
                  onChange={(e) => setHasDefect(e.target.checked)}
                  className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="font-bold text-red-700 text-sm">Flag Quality Defect / Pre-existing Damage</span>
              </label>

              {hasDefect && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-red-800 mb-1">Defect Details</label>
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
              {/* 新增：主管邮箱输入框 */}
<div className="mt-4">
  <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
    Supervisor Email Address
  </label>
  {/* 快速填充触发点 */}
  <div 
    className="mb-2 text-xs text-blue-600 cursor-pointer hover:underline"
    onClick={() => setSupervisorEmail("ajay@ebcometalfinishing.com")}
  >
    Click to auto-fill: ajay@ebcometalfinishing.com
  </div>
  <input
    type="email"
    placeholder="e.g. ajay@ebcometalfinishing.com"
    value={supervisorEmail}
    onChange={(e) => setSupervisorEmail(e.target.value)}
    className="w-full px-3 py-2 border border-red-300 rounded-md text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
  />
</div>
{/* 新增：照片上传 */}
<div className="mt-4">
  <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
    Attach Defect Photos
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
  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-bold"
  onClick={() => {
    const subject = encodeURIComponent("Defect Report");
    const body = encodeURIComponent(`Defect Details: ${defectDetails}`);
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
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Stage Operator Name</label>
                  <input
                    type="text"
                    placeholder="Operator Name"
                    value={stageOperator}
                    onChange={(e) => setStageOperator(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Process Notes / Parameters</label>
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

          {/* 5. Unloading & Skid Tracking Entry (全新以 Skid 为单位的卡片布局) */}
          {isUnloading && (
            <div className="p-5 bg-emerald-50/70 border-2 border-emerald-300 rounded-xl space-y-5">
              <div className="border-b border-emerald-200 pb-2 flex justify-between items-center">
                <h3 className="text-base font-bold text-emerald-900">Unloading & Skid Tracking Entry</h3>
                <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full">
                  Total Skids: {skids.length}
                </span>
              </div>

              {/* 1. 操作员与质量信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">Unloading Operator</label>
                  <input
                    type="text"
                    placeholder="Operator Name"
                    value={unloadingOperator}
                    onChange={(e) => setUnloadingOperator(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">Unloading Shift</label>
                  <select
                    value={unloadingShift}
                    onChange={(e) => setUnloadingShift(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="" disabled>Please select shift...</option>
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">Quality Inspection Status</label>
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

              {/* 2. 动态 Skid 列表 */}
              <div className="space-y-4 pt-2">
                <label className="block text-xs font-bold uppercase text-emerald-900">
                  Skid Breakdown (Quantity, Net Weight & Location)
                </label>

                {skids.map((skid, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm space-y-3">
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
                          placeholder=""
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

              {/* 3. 汇总与件数比对 */}
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
                  <label className={`block text-xs font-bold uppercase mb-1 ${
                    getTotalSkidPcs() !== 0 && getTotalSkidPcs() !== getRackLoadedTotalPcs() ? 'text-red-600' : 'text-emerald-800'
                  }`}>
                    Total Unloaded Skids (pcs) {
                      getTotalSkidPcs() !== 0 && getTotalSkidPcs() !== getRackLoadedTotalPcs() && '⚠️ Discrepancy!'
                    }
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
{/* 仅在第2至第9工序显示统一的上游缺陷报告挂载点，默认不勾选，明确指向历史/上游缺陷 */}
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
              <label htmlFor="stageDefectToggle" className="font-bold text-amber-800 text-sm cursor-pointer">
                REPORT UPSTREAM / PREVIOUS STAGE DEFECT
              </label>
            </div>

            {hasCurrentStageDefect() && (
              <div className="mt-2 pl-6 space-y-3 border-t border-amber-200 pt-3">
                {getCurrentStageNumber() >= 2 && getCurrentStageNumber() <= 8 && <IntermediateDefectSection stage={currentStage} />}
                {getCurrentStageNumber() === 9 && <UnloadingDefectSection />}
              </div>
            )}
          </div>
        )}
          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white rounded-lg shadow transition bg-blue-600 hover:bg-blue-700"
            >
              {isInitialLoading ? 'Save & Create Batch Record' : isUnloading ? 'Complete & Close Batch Record' : `Save ${currentStage} Status Log`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}