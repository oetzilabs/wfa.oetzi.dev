import { Resource } from "sst";
import { VFS } from "./vfs";

export module Downloader {
  export const getFile = async (
    filepath: string,
    from: VFS.From = { type: "r2", bucket: Resource.MainCloudflareStorage },
  ) => {
    const fileVFS = VFS.parseFilePath(filepath);
    if (!fileVFS) {
      throw new Error("File not found");
    }
    return VFS.getFileAsBuffer(fileVFS, from);
  };
}
