import { Resource } from "sst";
import { Cfg } from "./configurator";
import { VFS } from "./vfs";

export module Downloader {
  export const getFile = async (filepath: string, from: Cfg.Storage) => {
    const fileVFS = VFS.parseFilePath(filepath);
    if (!fileVFS) {
      throw new Error("File not found");
    }
    return VFS.getFileAsBuffer(fileVFS, from);
  };
  export const getFolder = async (folderpath: string, from: Cfg.Storage) => {
    const parsed_folder_path = VFS.parseFolderPath(folderpath);
    if (!parsed_folder_path) {
      throw new Error("Folder not found");
    }
    return VFS.getFolder(parsed_folder_path, from);
  };
}
