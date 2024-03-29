import { Model } from 'objection';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { ForeignAction } from '../src/types/foreign-action.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Relationship mapping', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test('should map belongsTo with hasOne and hasMany relations', () => {
    const users = InitiateTable('users');
    const posts = InitiateTable('posts');
    const profile = InitiateTable('profile');
    const avatar = InitiateTable('avatar');

    users.columns.id = createTestColumn(ColumnType.SERIAL);

    posts.columns.id = createTestColumn(ColumnType.SERIAL);
    posts.columns.userId = createTestColumn(ColumnType.INTEGER);
    posts.relations!.user = {
      columns: ['userId'],
      references: {
        table: 'users',
        columns: ['id'],
      },
      isLocalUnique: false,
      onDelete: ForeignAction.CASCADE,
      onUpdate: ForeignAction.CASCADE,
      meta: {},
    };

    profile.columns.id = createTestColumn(ColumnType.SERIAL);
    profile.columns.userId = createTestColumn(ColumnType.INTEGER);
    profile.relations!.user = {
      columns: ['userId'],
      references: {
        table: 'users',
        columns: ['id'],
      },
      isLocalUnique: true,
      onDelete: ForeignAction.CASCADE,
      onUpdate: ForeignAction.CASCADE,
      meta: {},
    };

    avatar.columns.id = createTestColumn(ColumnType.SERIAL);
    avatar.columns.userId = createTestColumn(ColumnType.INTEGER);
    avatar.relations!.user = {
      columns: ['userId'],
      references: {
        table: 'users',
        columns: ['id'],
      },
      isLocalUnique: true,
      onDelete: ForeignAction.CASCADE,
      onUpdate: ForeignAction.CASCADE,
      meta: {
        alias: 'owner',
      },
    };

    driver.models.addTable(users);
    driver.models.addTable(posts);
    driver.models.addTable(profile);
    driver.models.addTable(avatar);

    const User = driver.models.getModel('users');
    const Post = driver.models.getModel('posts');
    const Profile = driver.models.getModel('profile');
    const Avatar = driver.models.getModel('avatar');

    expect(User).toBeDefined();
    expect(Post).toBeDefined();
    expect(Profile).toBeDefined();
    expect(Avatar).toBeDefined();

    expect(User.relationMappings).toBeDefined();
    expect(Post.relationMappings).toBeDefined();
    expect(Profile.relationMappings).toBeDefined();
    expect(Avatar.relationMappings).toBeDefined();

    expect(Post.relationMappings).toHaveProperty('user');
    expect(Post.relationMappings).toHaveProperty(
      'user.relation',
      Model.BelongsToOneRelation,
    );

    expect(User.relationMappings).toHaveProperty('posts');
    expect(User.relationMappings).toHaveProperty(
      'posts.relation',
      Model.HasManyRelation,
    );

    expect(User.relationMappings).toHaveProperty('profile');
    expect(User.relationMappings).toHaveProperty(
      'profile.relation',
      Model.HasOneRelation,
    );

    expect(Profile.relationMappings).toHaveProperty('user');
    expect(Profile.relationMappings).toHaveProperty(
      'user.relation',
      Model.BelongsToOneRelation,
    );

    expect(User.relationMappings).toHaveProperty('avatar');
    expect(User.relationMappings).toHaveProperty(
      'avatar.relation',
      Model.HasOneRelation,
    );

    expect(Avatar.relationMappings).toHaveProperty('owner');
    expect(Avatar.relationMappings).toHaveProperty(
      'owner.relation',
      Model.BelongsToOneRelation,
    );
  });
});
