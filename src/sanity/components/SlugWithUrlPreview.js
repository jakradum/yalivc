import { SlugInput, useFormValue } from 'sanity';

export function SlugWithUrlPreview(props) {
  const slug = useFormValue(['slug', 'current']);
  const url = slug ? `https://team.yali.vc/letters/${slug}/` : null;

  return (
    <div>
      <SlugInput {...props} />
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.5 }}>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#830d35', wordBreak: 'break-all' }}
          >
            {url}
          </a>
        ) : (
          <span style={{ color: '#888' }}>
            URL will be generated after you generate slug. Make sure to hit Publish at the bottom.
          </span>
        )}
      </div>
    </div>
  );
}
