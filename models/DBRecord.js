var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

//try to implement two-phase commit
var DBRecord = new keystone.List(Constants.DBRecordListName, {
    label: '資料庫紀錄',
    hidden: true,
    nodelete: true,
    nocreate: true,
    noedit: true,
    track: {
        createdAt: true,
        updatedAt: true
    },
    defaultSort: '-createdAt'
});

var recEntry = new Schema({
    op: {
        type: String,
        enum: ['update','create','delete'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending','done','rollback'],
        required: true,
    },
    data: {
        type: {
            new: {
                type: Schema.Types.Mixed
            },
            old: {
                type: Schema.Types.Mixed
            },
            modelName: {
                type: String,
                required: true
            }
        },
        required: true
    }
    //update => data: { new: mixed, old: mixed },
    //delete => data: { old: mixed },
    //create => data: { new: mixed }
}, { _id: false } );

DBRecord.add({
    status: { type: Types.Select, label: '紀錄狀態', options: [ 
        { value: 'processing', label: '處理中' },
        { value: 'done', label: '完成' },
        { value: 'rollback', label: '退回' },
      ], index: true, required: true, trim: true, initial: true }
});

DBRecord.schema.add({
    steps: {
        type: [recEntry]
    }
});
DBRecord.defaultColumns = '';
DBRecord.register();
