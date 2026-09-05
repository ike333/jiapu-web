"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, ChevronRight, Users, Camera, Loader2 } from "lucide-react";
import { PhotoLightbox } from "./PhotoLightbox";
import { getPersonById, getAncestorPath, getChildren, displayName } from "@/lib/data";
import { stripSuffix } from "@/lib/router";
import { useClanId } from "@/lib/use-clan";
import ZmfButton from "@/components/ZmfButton";
import SceneRecommend from "@/components/SceneRecommend";
import { parseBirth, isZmfEligible } from "@/lib/birth";
import {
  fetchPhotos,
  uploadPhoto,
  resolvePhotoUrl,
  getUser,
  getToken,
  isAdmin,
  type PersonPhotos,
} from "@/lib/api";

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  );
}

function NotFound({ clanId, message }: { clanId: string; message: string }) {
  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-bold text-gray-900 mb-2">未找到此人</h2>
      <p className="text-gray-500 mb-4">{message}</p>
      <Link href={`/${clanId}/family-tree`} className="btn-primary">
        返回家谱树
      </Link>
    </div>
  );
}

function PersonContent() {
  const searchParams = useSearchParams();
  const clanId = useClanId();
  const id = searchParams.get("id");

  const [photoMap, setPhotoMap] = useState<Record<string, PersonPhotos> | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selfFile, setSelfFile] = useState<File | null>(null);
  const [spouseFile, setSpouseFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPhotos(clanId)
      .then((m) => alive && setPhotoMap(m))
      .catch(() => alive && setPhotoMap({}));
    return () => {
      alive = false;
    };
  }, [clanId]);

  if (!id) {
    return <NotFound clanId={clanId} message="请从搜索或家谱树中浏览" />;
  }

  const person = getPersonById(clanId, id);
  if (!person) {
    return <NotFound clanId={clanId} message={`ID: ${id}`} />;
  }

  const detailLines = person.detail
    ? person.detail.split(/\r?\n/).filter((l) => l.trim())
    : [];

  const ancestors = getAncestorPath(clanId, person.id);
  const children = getChildren(clanId, person.id);

  const personPhotos = photoMap?.[person.name] ?? null;
  const personPhoto = personPhotos
    ? {
        self: resolvePhotoUrl(personPhotos.self),
        spouse: resolvePhotoUrl(personPhotos.spouse),
      }
    : null;

  const user = getUser();
  const canUpload =
    !!getToken() &&
    !!user &&
    (user.role === "admin" || stripSuffix(user.name) === stripSuffix(person.name));

  const zmfEligible = isZmfEligible(person);
  const zmfBirth = parseBirth(person.detail || "");

  const handleUpload = useCallback(async () => {
    if (!selfFile && !spouseFile) {
      setUploadMsg({ ok: false, text: "请选择至少一张照片" });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      await uploadPhoto(clanId, person.name, {
        self: selfFile ?? undefined,
        spouse: spouseFile ?? undefined,
      });
      const m = await fetchPhotos(clanId);
      setPhotoMap(m);
      setSelfFile(null);
      setSpouseFile(null);
      setShowUpload(false);
      setUploadMsg({ ok: true, text: "上传成功" });
    } catch (e) {
      setUploadMsg({ ok: false, text: e instanceof Error ? e.message : "上传失败" });
    } finally {
      setUploading(false);
    }
  }, [clanId, person.name, selfFile, spouseFile]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Link
          href={`/${clanId}/family-tree`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} />
          返回家谱树
        </Link>

        <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400 ml-4">
          {ancestors.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} />}
              <Link
                href={`/${clanId}/person?id=${a.id}`}
                className="hover:text-primary-600 transition-colors"
              >
                {displayName(clanId, a.name)}
              </Link>
            </span>
          ))}
          {ancestors.length > 0 && <ChevronRight size={12} />}
          <span className="text-gray-700 font-medium">{displayName(clanId, person.name)}</span>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-2xl shrink-0
                  ${person.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
              >
                {displayName(clanId, person.name).slice(-1)}
              </div>
              <div>
                <h1 className="chinese-heading text-2xl font-bold text-gray-900">
                  {displayName(clanId, person.name)}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${person.gender === "male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}
                  >
                    {person.gender === "male" ? "男" : "女"}
                  </span>
                  <span className="text-xs text-gray-500">
                    第{person.generation}代 · {person.branch ? `${person.branch}房` : "始祖"}
                  </span>
                  {person.rank > 1 && (
                    <span className="text-xs text-gray-400">
                      排行第{person.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>

{person.spouseName && (
                  <div className="flex items-center gap-2 pl-1">
                    <Heart size={14} className="text-pink-500 shrink-0" />
                    <span className="text-sm text-gray-600">
                      {person.gender === "male" ? "妻" : "夫"}
                      <span className="font-medium text-gray-800">{person.spouseName}</span>
                    </span>
                  </div>
                )}

            {detailLines.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                {detailLines.map((line, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            )}

            {zmfEligible && !!getToken() && (
              <ZmfButton
                name={person.name}
                gender={person.gender}
                birthDate={zmfBirth?.solarDate}
              />
            )}
          </div>

          <div className="shrink-0 space-y-2">
            {(personPhoto?.self || personPhoto?.spouse) && (
              <PhotoLightbox
                selfPhoto={personPhoto?.self ?? null}
                spousePhoto={personPhoto?.spouse ?? null}
                personName={displayName(clanId, person.name)}
                spouseName={person.spouseName}
                gender={person.gender}
              />
            )}

            {canUpload && (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setShowUpload(!showUpload);
                    setUploadMsg(null);
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Camera size={14} />
                  {personPhoto?.self || personPhoto?.spouse ? "更换照片" : "上传照片"}
                </button>

                {showUpload && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-gray-600 shrink-0">本人照片</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-gray-500"
                        onChange={(e) => setSelfFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-gray-600 shrink-0">{person.gender === "male" ? "妻" : "夫"}照片</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-gray-500"
                        onChange={(e) => setSpouseFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {uploading && <Loader2 size={12} className="animate-spin" />}
                        {uploading ? "上传中…" : "上传"}
                      </button>
                      {uploadMsg && (
                        <span className={uploadMsg.ok ? "text-green-600" : "text-red-600"}>
                          {uploadMsg.text}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="card">
          <h2 className="chinese-heading text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} className="text-primary-500" />
            子女 ({children.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {children.map((child) => {
              const childPhotoUrl = resolvePhotoUrl(photoMap?.[child.name]?.self);
              return (
                <Link
                  key={child.id}
                  href={`/${clanId}/person?id=${child.id}`}
                  className="card-hover flex items-center gap-2 p-2.5"
                >
                  {childPhotoUrl ? (
                    <img
                      src={childPhotoUrl}
                      alt={displayName(clanId, child.name)}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium
                        ${child.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
                    >
                      {displayName(clanId, child.name).slice(-1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {displayName(clanId, child.name)}
                    </div>
                    {child.spouseName && (
                      <div className="text-xs text-gray-400 truncate">
                        {child.gender === "male" ? "妻" : "夫"}
                        {child.spouseName}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <SceneRecommend scene="birthday" title="给长辈挑件寿礼" />
      <SceneRecommend scene="memorial" title="缅怀祭祖 · 鲜花祭祀用品" />

    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PersonContent />
    </Suspense>
  );
}