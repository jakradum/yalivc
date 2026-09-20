'use client';
import { useEffect, useState } from 'react';
import { AssetPage } from '@/creative/render/AssetRenderer';
import { FORMATS } from '@/creative/formats';

export function PrintClient() {
  const [job, setJob] = useState(null);
  useEffect(() => {
    setJob(window.__creativeDoc || null);
  }, []);
  useEffect(() => {
    if (!job) return;
    let dead = false;
    (async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      if (!dead) document.body.setAttribute('data-creative-ready', '1');
    })();
    return () => { dead = true; };
  }, [job]);
  if (!job) return null;
  const f = FORMATS[job.doc.format];
  return (
    <>
      <style>{`html,body{margin:0;padding:0;background:#fff}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:${f.w}px ${f.h}px;margin:0}.cpg{width:${f.w}px;height:${f.h}px;overflow:hidden;break-after:page}`}</style>
      {job.pages.map((i) => (
        <div key={i} className="cpg"><AssetPage doc={job.doc} page={job.doc.pages[i]} /></div>
      ))}
    </>
  );
}
