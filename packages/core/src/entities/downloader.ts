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
  export const getFolder = async (
    folderpath: string,
    from: VFS.From = { type: "r2", bucket: Resource.MainCloudflareStorage },
  ) => {
    const parsed_folder_path = VFS.parseFolderPath(folderpath);
    if (!parsed_folder_path) {
      throw new Error("Folder not found");
    }
    return VFS.getFolder(parsed_folder_path, from);
  };
}
