  // ─── Avatar upload ────────────────────────────────────────────────────────

  async function performAvatarUpload(file) {
    if (!requireToken()) return;
    await withOp('avatar', async () => {
      toast('Processing image…', 'info');
      const pngBytes = await processImageFile(file);
      let binary = '';
      for (let i = 0; i < pngBytes.length; i++) binary += String.fromCharCode(pngBytes[i]);
      const b64 = btoa(binary);
      await wait(0.5, 1.0);
      const payload = {
        id: 'SetAvatarWithInventoryIds-F0A797E3E4F824F5EBB25AC691E33140',
        variables: {
          UpdateAvatarInput: {
            inventoryItemIds: [],
            snapshots: [{ type: 'FACE', data: b64 }, { type: 'FULL', data: b64 }],
          },
        },
      };
      const res = await mspGraphQLPersisted('/federationgateway/graphql', payload);
      const success = res?.data?.profileInventory?.updateAvatar?.success ?? false;
      if (!success) throw new Error('Server rejected the avatar update');
      toast('Profile picture updated!', 'success');
      refs.avatarDropzone?._reset();
    }).catch(err => toast(err.message ?? 'Avatar upload failed', 'error'));
  }

