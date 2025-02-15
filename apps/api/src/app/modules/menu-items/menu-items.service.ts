import { CreatableMenuItem, MenuItem, UpdatableMenuItem } from '@api-interfaces';
import { creatableMenuPhotoCodec, menuItemPhotoCodec } from '@api-interfaces/decoders/menu';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { FileUploaderService } from '@server/app/modules/file-uploader';
import { MenuItemsRepository } from '@server/app/repositories/menu-items';
import { flow, pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { MemoryStoredFile } from 'nestjs-form-data';
import { uuidv7 } from 'uuidv7';

@Injectable({
  scope: Scope.DEFAULT,
})
export class MenuItemsService {
  constructor(
    private readonly _menuItemsRepository: MenuItemsRepository,
    private readonly _fileUploader: FileUploaderService,
  ) {}

  // eslint-disable-next-line max-lines-per-function
  public createMany = ({
    organizationID,
    updatableItems,
    files,
  }: {
    readonly updatableItems: ReadonlyArray<CreatableMenuItem>;
    readonly organizationID: string;
    readonly files: Record<string, File>;
  }): TE.TaskEither<Exception, ReadonlyArray<MenuItem>> => {
    return pipe(
      TE.Do,
      // * Upload the restaurant files
      TE.chain(
        flow(
          () => updatableItems,
          TE.traverseArray((menuItem): TE.TaskEither<Exception, MenuItem> => {
            const { photo } = menuItem;

            return pipe(
              TE.Do,
              // Upload the files
              TE.chain((): TE.TaskEither<Exception, { filePath: string; id?: string } | null> => {
                // * Ignore cases

                // If there is no photo, we gonna return null
                if (photo === null) {
                  return TE.right(null);
                }

                // If the photo is already uploaded, we gonna return the current path
                if (menuItemPhotoCodec.is(photo)) {
                  return TE.right({ filePath: photo.filePath });
                }

                // * If the new file is null, we are removing the old one
                if (photo.newFile === null) {
                  return TE.right(null);
                }

                // We need to get the reference for the file in the form data, so if it's not a string, we gonna return an error
                if (!t.string.is(photo.newFile)) {
                  return TE.left(EXCEPTIONS.unprocessableEntity('File reference is not valid'));
                }

                // Get the file from the form data
                const fileToUpload = files[photo.newFile];

                // If the file is not valid, we gonna return an error
                if (!(fileToUpload instanceof MemoryStoredFile)) {
                  return TE.left(EXCEPTIONS.unprocessableEntity('File is not valid, please upload a valid image'));
                }

                // * FINALLY, we gonna try to upload the file
                const itemID = uuidv7();
                return pipe(
                  this._fileUploader.upload(fileToUpload, {
                    itemID: itemID,
                    ownerID: organizationID,
                  }),
                  TE.map(filePath => ({
                    filePath,
                    itemID,
                  })),
                );
              }),
              TE.map(data => {
                const uploadedMenuItem: MenuItem = {
                  ...menuItem,
                  id: data?.id ?? uuidv7(),
                  photo:
                    data === null
                      ? null
                      : {
                          filePath: data.filePath,
                        },
                };
                return uploadedMenuItem;
              }),
            );
          }),
        ),
      ),
      // * Update the items
      TE.chain(items =>
        pipe(
          this._menuItemsRepository.createMany(
            {
              organizationID,
            },
            items,
          ),
        ),
      ),
    );
  };

  // eslint-disable-next-line max-lines-per-function
  public updateOne = ({
    organizationID,
    updatableItem: menuItem,
    itemID,
    file,
  }: {
    readonly updatableItem: UpdatableMenuItem;
    readonly organizationID: string;
    readonly itemID: string;
    readonly file: unknown;
  }): TE.TaskEither<Exception, MenuItem> => {
    return pipe(
      TE.Do,
      // * Check if the user can update the menu item
      TE.chain(() =>
        pipe(
          this._menuItemsRepository.userHasAccessToMenuItem(itemID, organizationID),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Menu item not found')),
        ),
      ),
      // * Upload the items files
      TE.chain((savedMenuItem): TE.TaskEither<Exception, MenuItem> => {
        const { photo } = menuItem;

        const deletePreviousImageTask = (): TE.TaskEither<Exception, void> => {
          // * If it's a creatable photo, the user is uploading one photo, so in this case we check if the file has a previous file path and delete it
          if (creatableMenuPhotoCodec.is(photo) && savedMenuItem.photo?.filePath) {
            return pipe(
              this._fileUploader.delete(savedMenuItem.photo.filePath),
              TE.fold(
                // Ignore the error if it's happen because we don't wanna to cancel the whole operation
                () => TE.right(void 0),
                // The file was deleted
                () => TE.right(void 0),
              ),
            );
          }
          return TE.right(void 0);
        };

        return pipe(
          // * Delete the previous photo if necessary
          deletePreviousImageTask(),
          // * Upload the files
          TE.chain(() => {
            // * Ignore cases

            // If there is no photo, we gonna return null
            if (photo === null) {
              return TE.right(null);
            }

            // If the photo is already uploaded, we gonna return the current path
            if (menuItemPhotoCodec.is(photo)) {
              return TE.right(photo.filePath);
            }

            // If the file is not valid, we gonna return an error
            const fileToUpload = file;
            if (!(fileToUpload instanceof MemoryStoredFile)) {
              // * If the new file is not a File & we have a previous file, the user is just deleting
              if (photo.previousFilePath) {
                return TE.right(null);
              }

              return TE.left(EXCEPTIONS.unprocessableEntity('File is not valid, please upload a valid image'));
            }

            // * FINALLY, we gonna try to upload the file
            return pipe(
              this._fileUploader.upload(fileToUpload, {
                itemID,
                ownerID: organizationID,
              }),
            );
          }),
          TE.map(filePath => {
            const uploadedMenuItem: MenuItem = {
              ...menuItem,
              photo:
                filePath === null
                  ? null
                  : {
                      filePath: filePath,
                    },
            };
            return uploadedMenuItem;
          }),
        );
      }),
      // * Update the restaurant
      TE.chain(item =>
        pipe(
          this._menuItemsRepository.updateOne(
            {
              id: itemID,
              organizationID,
            },
            item,
          ),
        ),
      ),
    );
  };

  public deleteOne = ({
    loggedUser,
    itemID,
  }: {
    readonly itemID: string;
    readonly loggedUser: LoggedUser;
  }): TE.TaskEither<Exception, void> => {
    return pipe(
      // ? The repository `deleteOne` will check if the user is the owner of the item in the query by searching the item by ID and organizationID
      // * Delete the item
      this._menuItemsRepository.findOnePhoto(itemID, loggedUser.organizationID),
      TE.bindTo('photo'),
      TE.bind('deleted', () =>
        this._menuItemsRepository.deleteOne({
          id: itemID,
          organizationID: loggedUser.organizationID,
        }),
      ),
      // * Delete the photo if it exists
      TE.chain(({ photo }) => {
        if (!photo) {
          return TE.right(void 0);
        }

        return pipe(
          this._fileUploader.delete(photo),
          TE.fold(
            // Ignore the error if it's happen because we don't wanna to cancel the whole operation
            () => TE.right(void 0),
            // The file was deleted
            () => TE.right(void 0),
          ),
        );
      }),
    );
  };

  public getAllForOrganization = (organizationID: string): TE.TaskEither<Exception, ReadonlyArray<MenuItem>> => {
    return pipe(
      organizationID,
      this._menuItemsRepository.findAllForOrganization,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('User not found')),
    );
  };
}
