import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/lib/constants';
import { Youtube, Activity, Loader2, Search, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  exerciseName: string;
  exerciseId?: string;
  fallbackBiomechanics?: string;
  youtubeUrl?: string;
}

interface ExercicioLookup {
  id: string;
  nome: string;
  youtube_video_id: string | null;
  url_video_interna: string | null;
  orientacao_biomecanica: string | null;
}

function extractYoutubeId(url: string): string {
  if (!url) return '';
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^&?#\s]+)/
  );
  return match?.[1] ?? '';
}

// Build a YouTube search URL scoped to the ROI SHAPE channel
function buildChannelSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} ${BRAND.youtubeChannelName}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

// Build a search URL filtered to the channel via YouTube's search filter
function buildChannelFilteredSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(exerciseName);
  return `https://www.youtube.com/results?search_query=${query}&sp=CAMSAhABUAE%253D`;
}

export function VideoPlayer({ exerciseName, exerciseId, fallbackBiomechanics, youtubeUrl }: VideoPlayerProps) {
  const [exercicio, setExercicio] = useState<ExercicioLookup | null>(null);
  const [loading, setLoading] = useState(true);

  const lookup = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('exercicios')
      .select('id, nome, youtube_video_id, url_video_interna, orientacao_biomecanica');

    if (exerciseId) {
      query = query.eq('id', exerciseId);
    } else {
      query = query.ilike('nome', exerciseName);
    }

    const { data } = await query.maybeSingle();
    setExercicio(data as ExercicioLookup | null);
    setLoading(false);
  }, [exerciseName, exerciseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await lookup();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [lookup]);

  if (loading) {
    return (
      <div className="w-full max-w-[320px] max-h-[340px] aspect-[9/16] rounded-xl bg-dark-900 flex items-center justify-center mx-auto">
        <Loader2 className="w-6 h-6 text-neon-500 animate-spin" />
      </div>
    );
  }

  const dbYoutubeId = exercicio?.youtube_video_id;
  const internalUrl = exercicio?.url_video_interna;
  const biomechanics = exercicio?.orientacao_biomecanica || fallbackBiomechanics;
  const urlYoutubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : '';
  const youtubeId = dbYoutubeId || urlYoutubeId;

  if (youtubeId) {
    return (
      <div className="w-full max-w-[320px] max-h-[340px] aspect-[9/16] rounded-xl overflow-hidden bg-dark-900 relative group mx-auto">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={exerciseName}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
        <a
          href={`https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-950/80 rounded-lg px-2 py-1 text-[10px] text-gray-300 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          YouTube
        </a>
      </div>
    );
  }

  if (internalUrl) {
    return (
      <div className="w-full max-w-[320px] max-h-[340px] aspect-[9/16] rounded-xl overflow-hidden bg-dark-900 mx-auto">
        <video
          src={internalUrl}
          controls
          className="w-full h-full"
          preload="metadata"
        >
          <p className="text-xs text-gray-500 p-4">Seu navegador não suporta vídeo nativo.</p>
        </video>
      </div>
    );
  }

  // Fallback: no video found — show search link scoped to ROI SHAPE channel
  const channelSearchUrl = buildChannelSearchUrl(exerciseName);
  const filteredSearchUrl = buildChannelFilteredSearchUrl(exerciseName);

  return (
    <div className="w-full max-w-[320px] max-h-[340px] aspect-[9/16] rounded-xl bg-dark-900 flex flex-col items-center justify-center p-3 text-center border border-dark-600 mx-auto">
      <div className="w-12 h-12 rounded-full bg-neon-500/10 flex items-center justify-center mb-3">
        <Youtube className="w-6 h-6 text-neon-500" />
      </div>
      {biomechanics ? (
        <>
          <p className="text-xs font-semibold text-neon-400 uppercase tracking-wider mb-1">Orientação Biomecânica</p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-3">{biomechanics}</p>
        </>
      ) : (
        <p className="text-xs text-gray-600 mb-3">Sem vídeo cadastrado para este exercício</p>
      )}
      <div className="flex flex-col gap-2 items-center">
        <a
          href={channelSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary px-4 py-2 text-xs flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          Buscar no Canal {BRAND.youtubeChannelName}
        </a>
        <a
          href={BRAND.youtubeChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-500 hover:text-neon-400 transition-colors flex items-center gap-1"
        >
          <Youtube className="w-3 h-3" />
          {BRAND.youtubeChannelUrl.replace('https://www.youtube.com/', '')}
        </a>
      </div>
    </div>
  );
}
