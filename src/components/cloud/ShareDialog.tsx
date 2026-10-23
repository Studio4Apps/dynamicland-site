'use client';
import { useState } from 'react';
import { expiryLabels, isExecutable } from '@/lib/cloud/files';
import type { CloudItem, LinkExpiry, ShareSettings } from '@/lib/cloud/types';
import { FileGlyph } from './FileGlyph';
import { Icon } from './Icons';
import { Dialog, Switch } from './Overlay';
import styles from './Cloud.module.css';

export function ShareDialog({
  item,
  maxDownloads,
  onClose,
  onSave,
  onCopy,
}: {
  item: CloudItem;
  maxDownloads: number;
  onClose: () => void;
  onSave: (share: ShareSettings) => void;
  onCopy: () => void;
}) {
  const [share, setShare] = useState<ShareSettings>(item.share);
  const blocked = isExecutable(item.name);
  const dirty = JSON.stringify(share) !== JSON.stringify(item.share);
  const save = () => {
    onSave(share);
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Share “${item.name}”`}
      description="Copy the link and send it however you like. People who have it can view the file without an account."
    >
      <section className={styles.linkPanel} aria-labelledby="link-heading">
        <div className={styles.shareHead}>
          <span className={styles.shareGlyph}>
            <FileGlyph item={item} size="small" />
          </span>
          <h3 id="link-heading">
            <Icon name="link" size={18} /> Share with a link
          </h3>
          <Switch
            label="Share with a link"
            checked={share.link}
            disabled={blocked}
            onChange={(link) => setShare((s) => ({ ...s, link }))}
          />
        </div>
        {blocked && (
          <p className={styles.hint}>
            <Icon name="shield" size={14} />
            Apps, scripts and web files can’t be shared by link.
          </p>
        )}
        {share.link && (
          <div className={styles.linkOptions}>
            <label className={styles.optionRow}>
              <span>Link expires after</span>
              <select
                className={styles.select}
                value={share.expiry}
                onChange={(event) =>
                  setShare((s) => ({ ...s, expiry: event.target.value as LinkExpiry }))
                }
              >
                {(Object.keys(expiryLabels) as LinkExpiry[]).map((key) => (
                  <option key={key} value={key}>
                    {expiryLabels[key]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.optionRow}>
              <span>Allow downloads</span>
              <Switch
                label="Allow downloads"
                checked={share.allowDownload}
                onChange={(allowDownload) => setShare((s) => ({ ...s, allowDownload }))}
              />
            </div>
            <p className={styles.hint}>
              <Icon name="info" size={14} />
              {share.allowDownload
                ? `The link stops working after ${maxDownloads} downloads. You can make a new one any time.`
                : 'People can view the file but not download it.'}
            </p>
          </div>
        )}
      </section>

      <div className={styles.dialogActions}>
        {item.share.link && !dirty && (
          <button type="button" className={styles.buttonQuiet} onClick={onCopy}>
            <Icon name="copy" size={17} /> Copy link
          </button>
        )}
        <span className={styles.spacer} />
        <button type="button" className={styles.buttonQuiet} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={styles.buttonPrimary} onClick={save} disabled={!dirty}>
          Save
        </button>
      </div>
    </Dialog>
  );
}
