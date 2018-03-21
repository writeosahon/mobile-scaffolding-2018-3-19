import { Browser, ChildProperty, Collection, Complex, Component, Draggable, Droppable, Event, EventHandler, Internationalization, KeyboardEvents, L10n, NotifyPropertyChanges, Property, addClass, append, attributes, classList, closest, compile, createElement, debounce, detach, extend, formatUnit, getEnumValue, getValue, isNullOrUndefined, isUndefined, matches, merge, print, remove, removeClass, setCulture, setStyleAttribute, setValue } from '@syncfusion/ej2-base';
import { DataManager, DataUtil, Deferred, Predicate, Query, UrlAdaptor } from '@syncfusion/ej2-data';
import { Dialog, Tooltip, calculatePosition, calculateRelativeBasedPosition, createSpinner, hideSpinner, showSpinner } from '@syncfusion/ej2-popups';
import { Button, CheckBox, RadioButton, createCheckBox } from '@syncfusion/ej2-buttons';
import { FormValidator, Input, NumericTextBox } from '@syncfusion/ej2-inputs';
import { AutoComplete, DropDownList } from '@syncfusion/ej2-dropdowns';
import { DatePicker } from '@syncfusion/ej2-calendars';
import { ContextMenu, Toolbar } from '@syncfusion/ej2-navigations';
import { Workbook } from '@syncfusion/ej2-excel-export';
import { PdfBitmap, PdfBorders, PdfColor, PdfCompositeField, PdfDocument, PdfFontFamily, PdfFontStyle, PdfGrid, PdfPageCountField, PdfPageNumberField, PdfPageOrientation, PdfPageSettings, PdfPageTemplateElement, PdfPen, PdfSolidBrush, PdfStandardFont, PdfStringFormat, PdfTextAlignment, PdfVerticalAlignment, PointF, RectangleF, SizeF } from '@syncfusion/ej2-pdf-export';

/**
 * ValueFormatter class to globalize the value.
 * @hidden
 */
class ValueFormatter {
    constructor(cultureName) {
        this.intl = new Internationalization();
        if (!isNullOrUndefined(cultureName)) {
            this.intl.culture = cultureName;
        }
    }
    getFormatFunction(format) {
        if (format.type) {
            return this.intl.getDateFormat(format);
        }
        else {
            return this.intl.getNumberFormat(format);
        }
    }
    getParserFunction(format) {
        if (format.type) {
            return this.intl.getDateParser(format);
        }
        else {
            return this.intl.getNumberParser(format);
        }
    }
    fromView(value, format, type) {
        if (type === 'date' || type === 'datetime' || type === 'number') {
            return format(value);
        }
        else {
            return value;
        }
    }
    toView(value, format) {
        let result = value;
        if (!isNullOrUndefined(format) && !isNullOrUndefined(value)) {
            result = format(value);
        }
        return result;
    }
    setCulture(cultureName) {
        if (!isNullOrUndefined(cultureName)) {
            setCulture(cultureName);
        }
    }
}

/**
 * Represents Grid `Column` model class.
 */
class Column {
    constructor(options) {
        /**
         * If `allowSorting` set to false, then it disables sorting option of a particular column.
         * By default all columns are sortable.
         * @default true
         */
        this.allowSorting = true;
        /**
         * If `allowResizing` is set to false, it disables resize option of a particular column.
         * By default all the columns can be resized.
         * @default true
         */
        this.allowResizing = true;
        /**
         * If `allowFiltering` set to false, then it disables filtering option and filter bar element of a particular column.
         * By default all columns are filterable.
         * @default true
         */
        this.allowFiltering = true;
        /**
         * If `allowGrouping` set to false, then it disables grouping of a particular column.
         * By default all columns are groupable.
         * @default true
         */
        this.allowGrouping = true;
        /**
         * If `showColumnMenu` set to false, then it disable the column menu of a particular column.
         * By default column menu will show for all columns
         * @default true
         */
        this.showColumnMenu = true;
        /**
         * If `enableGroupByFormat` set to true, then it groups the particular column by formatted values.
         * @default true
         */
        this.enableGroupByFormat = false;
        /**
         * If `allowEditing` set to false, then it disables editing of a particular column.
         * By default all columns are editable.
         * @default true
         */
        this.allowEditing = true;
        /**
         *  It is used to customize the default filter options for a specific columns.
         * * type -  Specifies the filter type as menu or checkbox.
         * * ui - to render custom component for specific column it has following functions.
         * * ui.create – It is used for creating custom components.
         * * ui.read -  It is used for read the value from the component.
         * * ui.write - It is used to apply component model as dynamically.
         * {% codeBlock src="grid/filter-menu-api/index.ts" %}{% endcodeBlock %}
         *
         * > Check the [`Filter UI`](./filtering.html#custom-component-in-filter-menu) for its customization.
         *  @default null
         */
        this.filter = {};
        /**
         * If `showInColumnChooser` set to false, then hide the particular column in column chooser.
         *  By default all columns are displayed in column Chooser.
         * @default true
         */
        this.showInColumnChooser = true;
        /**
         * Defines the `IEditCell` object to customize default edit cell.
         * @default {}
         */
        this.edit = {};
        this.sortDirection = 'Descending';
        merge(this, options);
        this.uid = getUid('grid-column');
        let valueFormatter = new ValueFormatter();
        if (options.format && (options.format.skeleton || options.format.format)) {
            this.setFormatter(valueFormatter.getFormatFunction(options.format));
            this.setParser(valueFormatter.getParserFunction(options.format));
        }
        if (!this.field) {
            this.allowFiltering = false;
            this.allowGrouping = false;
            this.allowSorting = false;
        }
        if (this.commands && !this.textAlign) {
            this.textAlign = 'Right';
        }
        if (this.template || this.commandsTemplate) {
            this.templateFn = templateCompiler(this.template || this.commandsTemplate);
        }
        if (this.filter.itemTemplate) {
            this.fltrTemplateFn = templateCompiler(this.filter.itemTemplate);
        }
        if (this.isForeignColumn() && isNullOrUndefined(this.editType)) {
            this.editType = 'dropdownedit';
            this.edit.params = {
                dataSource: this.dataSource,
                query: new Query(), fields: { value: this.foreignKeyField || this.field, text: this.foreignKeyValue }
            };
        }
        if (this.sortComparer) {
            let a = this.sortComparer;
            this.sortComparer = function comparer(x, y) {
                if (this.sortDirection === 'Descending') {
                    let z = x;
                    x = y;
                    y = z;
                }
                return a(x, y);
            };
        }
        if (!this.sortComparer && this.isForeignColumn()) {
            this.sortComparer = (x, y) => {
                x = getValue(this.foreignKeyValue, getForeignData(this, {}, x)[0]);
                y = getValue(this.foreignKeyValue, getForeignData(this, {}, y)[0]);
                return this.sortDirection === 'Descending' ? DataUtil.fnDescending(x, y) : DataUtil.fnAscending(x, y);
            };
        }
    }
    /** @hidden */
    getSortDirection() {
        return this.sortDirection;
    }
    /** @hidden */
    setSortDirection(direction) {
        this.sortDirection = direction;
    }
    /** @hidden */
    setProperties(column) {
        //Angular two way binding
        let keys = Object.keys(column);
        for (let i = 0; i < keys.length; i++) {
            this[keys[i]] = column[keys[i]];
        }
    }
    /**
     * @hidden
     * It defines the column is foreign key column or not.
     */
    isForeignColumn() {
        return !!(this.dataSource && this.foreignKeyValue);
    }
    /** @hidden */
    getFormatter() {
        return this.formatFn;
    }
    /** @hidden */
    setFormatter(value) {
        this.formatFn = value;
    }
    /** @hidden */
    getParser() {
        return this.parserFn;
    }
    /** @hidden */
    setParser(value) {
        this.parserFn = value;
    }
    /** @hidden */
    getColumnTemplate() {
        return this.templateFn;
    }
    /** @hidden */
    getFilterItemTemplate() {
        return this.fltrTemplateFn;
    }
    /** @hidden */
    getDomSetter() {
        return this.disableHtmlEncode ? 'textContent' : 'innerHTML';
    }
}

//https://typescript.codeplex.com/discussions/401501
/**
 * Function to check whether target object implement specific interface
 * @param  {Object} target
 * @param  {string} checkFor
 * @returns no
 * @hidden
 */
function doesImplementInterface(target, checkFor) {
    /* tslint:disable:no-any */
    return target.prototype && checkFor in target.prototype;
}
/**
 * Function to get value from provided data
 * @param  {string} field
 * @param  {Object} data
 * @param  {IColumn} column
 * @hidden
 */
function valueAccessor(field, data, column) {
    field = isNullOrUndefined(field) ? '' : field;
    return getValue(field, data);
}
/**
 * The function used to update Dom using requestAnimationFrame.
 * @param  {Function} fn - Function that contains the actual action
 * @return {Promise<T>}
 * @hidden
 */
function getUpdateUsingRaf(updateFunction, callBack) {
    requestAnimationFrame(() => {
        try {
            callBack(null, updateFunction());
        }
        catch (e) {
            callBack(e);
        }
    });
}
/**
 * @hidden
 */
function iterateArrayOrObject(collection, predicate) {
    let result = [];
    for (let i = 0, len = collection.length; i < len; i++) {
        let pred = predicate(collection[i], i);
        if (!isNullOrUndefined(pred)) {
            result.push(pred);
        }
    }
    return result;
}
/** @hidden */
function templateCompiler(template) {
    if (template) {
        try {
            if (document.querySelectorAll(template).length) {
                return compile(document.querySelector(template).innerHTML.trim());
            }
        }
        catch (e) {
            return compile(template);
        }
    }
    return undefined;
}
/** @hidden */
function setStyleAndAttributes(node, customAttributes) {
    let copyAttr = {};
    let literals = ['style', 'class'];
    //Dont touch the original object - make a copy
    extend(copyAttr, customAttributes, {});
    if ('style' in copyAttr) {
        setStyleAttribute(node, copyAttr[literals[0]]);
        delete copyAttr[literals[0]];
    }
    if ('class' in copyAttr) {
        addClass([node], copyAttr[literals[1]]);
        delete copyAttr[literals[1]];
    }
    attributes(node, copyAttr);
}
/** @hidden */
function extend$1(copied, first, second, exclude) {
    let moved = extend(copied, first, second);
    Object.keys(moved).forEach((value, index) => {
        if (exclude.indexOf(value) !== -1) {
            delete moved[value];
        }
    });
    return moved;
}
/** @hidden */
function prepareColumns(columns, autoWidth) {
    for (let c = 0, len = columns.length; c < len; c++) {
        let column;
        if (typeof columns[c] === 'string') {
            column = new Column({ field: columns[c] });
        }
        else if (!(columns[c] instanceof Column)) {
            if (!columns[c].columns) {
                column = new Column(columns[c]);
            }
            else {
                column = new Column(columns[c]);
                columns[c].columns = prepareColumns(columns[c].columns);
            }
        }
        else {
            column = columns[c];
        }
        column.headerText = isNullOrUndefined(column.headerText) ? column.foreignKeyValue || column.field || '' : column.headerText;
        column.foreignKeyField = column.foreignKeyField || column.field;
        column.valueAccessor = column.valueAccessor || valueAccessor;
        column.width = autoWidth && isNullOrUndefined(column.width) ? 200 : column.width;
        if (isNullOrUndefined(column.visible)) {
            column.visible = true;
        }
        columns[c] = column;
    }
    return columns;
}
/** @hidden */
function setCssInGridPopUp(popUp, e, className) {
    let popUpSpan = popUp.querySelector('span');
    let position = popUp.parentElement.getBoundingClientRect();
    let targetPosition = e.target.getBoundingClientRect();
    let isBottomTail;
    popUpSpan.className = className;
    popUp.style.display = '';
    isBottomTail = (isNullOrUndefined(e.clientY) ? e.changedTouches[0].clientY :
        e.clientY) > popUp.offsetHeight + 10;
    popUp.style.top = targetPosition.top - position.top +
        (isBottomTail ? -(popUp.offsetHeight + 10) : popUp.offsetHeight + 10) + 'px'; //10px for tail element
    popUp.style.left = getPopupLeftPosition(popUp, e, targetPosition, position.left) + 'px';
    if (isBottomTail) {
        popUp.querySelector('.e-downtail').style.display = '';
        popUp.querySelector('.e-uptail').style.display = 'none';
    }
    else {
        popUp.querySelector('.e-downtail').style.display = 'none';
        popUp.querySelector('.e-uptail').style.display = '';
    }
}
/** @hidden */
function getPopupLeftPosition(popup, e, targetPosition, left) {
    let width = popup.offsetWidth / 2;
    let x = getPosition(e).x;
    if (x - targetPosition.left < width) {
        return targetPosition.left - left;
    }
    else if (targetPosition.right - x < width) {
        return targetPosition.right - left - width * 2;
    }
    else {
        return x - left - width;
    }
}
/** @hidden */
function getActualProperties(obj) {
    if (obj instanceof ChildProperty) {
        return getValue('properties', obj);
    }
    else {
        return obj;
    }
}
/** @hidden */
function parentsUntil(elem, selector, isID) {
    let parent = elem;
    while (parent) {
        if (isID ? parent.id === selector : parent.classList.contains(selector)) {
            break;
        }
        parent = parent.parentElement;
    }
    return parent;
}
/** @hidden */
function getElementIndex(element, elements) {
    let index = -1;
    for (let i = 0, len = elements.length; i < len; i++) {
        if (elements[i].isEqualNode(element)) {
            index = i;
            break;
        }
    }
    return index;
}
/** @hidden */
function inArray(value, collection) {
    for (let i = 0, len = collection.length; i < len; i++) {
        if (collection[i] === value) {
            return i;
        }
    }
    return -1;
}
/** @hidden */
function getActualPropFromColl(collection) {
    let coll = [];
    for (let i = 0, len = collection.length; i < len; i++) {
        if (collection[i].hasOwnProperty('properties')) {
            coll.push(collection[i].properties);
        }
        else {
            coll.push(collection[i]);
        }
    }
    return coll;
}
/** @hidden */
function removeElement(target, selector) {
    let elements = [].slice.call(target.querySelectorAll(selector));
    for (let i = 0; i < elements.length; i++) {
        remove(elements[i]);
    }
}
/** @hidden */
function getPosition(e) {
    let position = {};
    position.x = (isNullOrUndefined(e.clientX) ? e.changedTouches[0].clientX :
        e.clientX);
    position.y = (isNullOrUndefined(e.clientY) ? e.changedTouches[0].clientY :
        e.clientY);
    return position;
}
let uid = 0;
/** @hidden */
function getUid(prefix) {
    return prefix + uid++;
}
/** @hidden */
function appendChildren(elem, children) {
    for (let i = 0, len = children.length; i < len; i++) {
        if (len === children.length) {
            elem.appendChild(children[i]);
        }
        else {
            elem.appendChild(children[0]);
        }
    }
    return elem;
}
/** @hidden */
function parents(elem, selector, isID) {
    let parent = elem;
    let parents = [];
    while (parent) {
        if (isID ? parent.id === selector : parent.classList.contains(selector)) {
            parents.push(parent);
        }
        parent = parent.parentElement;
    }
    return parents;
}
/** @hidden */
function calculateAggregate(type, data, column, context) {
    if (type === 'Custom') {
        return column.customAggregate ? column.customAggregate.call(context, data, column) : '';
    }
    return DataUtil.aggregates[type.toLowerCase()](data, column.field);
}
/** @hidden */
let scrollWidth = null;
/** @hidden */
function getScrollBarWidth() {
    if (scrollWidth !== null) {
        return scrollWidth;
    }
    let divNode = document.createElement('div');
    let value = 0;
    divNode.style.cssText = 'width:100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;';
    document.body.appendChild(divNode);
    value = (divNode.offsetWidth - divNode.clientWidth) | 0;
    document.body.removeChild(divNode);
    return scrollWidth = value;
}
/** @hidden */
let rowHeight;
/** @hidden */
function getRowHeight(element) {
    if (rowHeight !== undefined) {
        return rowHeight;
    }
    let table = createElement('table', { className: 'e-table', styles: 'visibility: hidden' });
    table.innerHTML = '<tr><td class="e-rowcell">A<td></tr>';
    element.appendChild(table);
    let rect = table.querySelector('td').getBoundingClientRect();
    element.removeChild(table);
    rowHeight = Math.ceil(rect.height);
    return rowHeight;
}
/** @hidden */
function isEditable(col, type, elem) {
    let row = parentsUntil(elem, 'e-row');
    let isOldRow = !row ? true : row && !row.classList.contains('e-insertedrow');
    if (type === 'beginEdit' && isOldRow) {
        if (col.isIdentity || col.isPrimaryKey || !col.allowEditing) {
            return false;
        }
        return true;
    }
    else if (type === 'add' && col.isIdentity && col.isPrimaryKey) {
        return false;
    }
    else {
        if (isOldRow && !col.allowEditing && !col.isIdentity && !col.isPrimaryKey) {
            return false;
        }
        return true;
    }
}
/** @hidden */
function isActionPrevent(inst) {
    let dlg = inst.element.querySelector('#' + inst.element.id + 'EditConfirm');
    return inst.editSettings.mode === 'Batch' &&
        (inst.element.querySelectorAll('.e-updatedtd').length) && inst.editSettings.showConfirmDialog &&
        (dlg ? dlg.classList.contains('e-popup-close') : true);
}
/** @hidden */
function wrap(elem, action) {
    let clName = 'e-wrap';
    elem = elem instanceof Array ? elem : [elem];
    for (let i = 0; i < elem.length; i++) {
        action ? elem[i].classList.add(clName) : elem[i].classList.remove(clName);
    }
}
function changeButtonType(target) {
    let elements = [].slice.call(target.querySelectorAll('button'));
    for (let button of elements) {
        attributes(button, { type: 'button' });
    }
}
/** @hidden */
function setFormatter(serviceLocator, column) {
    let fmtr = serviceLocator.getService('valueFormatter');
    switch (column.type) {
        case 'date':
            column.setFormatter(fmtr.getFormatFunction({ type: 'date', skeleton: column.format }));
            column.setParser(fmtr.getParserFunction({ type: 'date', skeleton: column.format }));
            break;
        case 'datetime':
            column.setFormatter(fmtr.getFormatFunction({ type: 'dateTime', skeleton: column.format }));
            column.setParser(fmtr.getParserFunction({ type: 'dateTime', skeleton: column.format }));
            break;
        case 'number':
            column.setFormatter(fmtr.getFormatFunction({ format: column.format }));
            column.setParser(fmtr.getParserFunction({ format: column.format }));
            break;
    }
}
/** @hidden */
function addRemoveActiveClasses(cells, add, ...args) {
    for (let i = 0, len = cells.length; i < len; i++) {
        if (add) {
            classList(cells[i], [...args], []);
            cells[i].setAttribute('aria-selected', 'true');
        }
        else {
            classList(cells[i], [], [...args]);
            cells[i].removeAttribute('aria-selected');
        }
    }
}
/** @hidden */
function distinctStringValues(result) {
    let temp = {};
    let res = [];
    for (let i = 0; i < result.length; i++) {
        if (!(result[i] in temp)) {
            res.push(result[i].toString());
            temp[result[i]] = 1;
        }
    }
    return res;
}
/** @hidden */
function getFilterMenuPostion(target, dialogObj, grid) {
    let elementVisible = dialogObj.element.style.display;
    dialogObj.element.style.display = 'block';
    let dlgWidth = dialogObj.width;
    let newpos;
    if (!grid.enableRtl) {
        newpos = calculateRelativeBasedPosition(target, dialogObj.element);
        dialogObj.element.style.display = elementVisible;
        dialogObj.element.style.top = (newpos.top + target.getBoundingClientRect().height) - 5 + 'px';
        let leftPos = ((newpos.left - dlgWidth) + target.clientWidth);
        if (leftPos < 1) {
            dialogObj.element.style.left = (dlgWidth + leftPos) - 16 + 'px'; // right calculation
        }
        else {
            dialogObj.element.style.left = leftPos + -4 + 'px';
        }
    }
    else {
        newpos = calculatePosition(target, 'left', 'bottom');
        dialogObj.element.style.top = (newpos.top + target.getBoundingClientRect().height) - 35 + 'px';
        dialogObj.element.style.display = elementVisible;
        let leftPos = ((newpos.left - dlgWidth) + target.clientWidth);
        if (leftPos < 1) {
            dialogObj.element.style.left = (dlgWidth + leftPos) + -16 + 'px';
        }
        else {
            dialogObj.element.style.left = leftPos - 16 + 'px';
        }
    }
}
/** @hidden */
function getZIndexCalcualtion(args, dialogObj) {
    args.popup.element.style.zIndex = (dialogObj.zIndex + 1).toString();
}
/** @hidden */
function toogleCheckbox(elem) {
    let span = elem.querySelector('.e-frame');
    span.classList.contains('e-check') ? classList(span, ['e-uncheck'], ['e-check']) :
        classList(span, ['e-check'], ['e-uncheck']);
}
/** @hidden */
function createCboxWithWrap(uid, elem, className) {
    let div = createElement('div', { className: className });
    div.appendChild(elem);
    div.setAttribute('uid', uid);
    return div;
}
/** @hidden */
function removeAddCboxClasses(elem, checked) {
    removeClass([elem], ['e-check', 'e-stop', 'e-uncheck']);
    if (checked) {
        elem.classList.add('e-check');
    }
    else {
        elem.classList.add('e-uncheck');
    }
}
/**
 * Refresh the Row model's foreign data.
 * @param row - Grid Row model object.
 * @param columns - Foreign columns array.
 * @param data - Updated Row data.
 * @hidden
 */
function refreshForeignData(row, columns, data) {
    columns.forEach((col) => {
        setValue(col.field, getForeignData(col, data), row.foreignKeyData);
    });
    row.cells.forEach((cell) => {
        if (cell.isForeignKey) {
            setValue('foreignKeyData', getValue(cell.column.field, row.foreignKeyData), cell);
        }
    });
}
/**
 * Get the foreign data for the corresponding cell value.
 * @param column - Foreign Key column
 * @param data - Row data.
 * @param lValue - cell value.
 * @param foreignData - foreign data source.
 * @hidden
 */
function getForeignData(column, data, lValue, foreignKeyData) {
    let fField = column.foreignKeyField;
    let key = (lValue || valueAccessor(column.field, data, column)) || '';
    let query = new Query();
    let fdata = foreignKeyData || (column.dataSource instanceof DataManager) && column.dataSource.dataSource.offline ?
        column.dataSource.dataSource.json : column.columnData;
    if (key.getDay) {
        query.where(getDatePredicate({ field: fField, operator: 'equal', value: key, matchCase: false }));
    }
    else {
        query.where(fField, '==', key, false);
    }
    return new DataManager(fdata).executeLocal(query);
}
/**
 * To use to get the column's object by the foreign key value.
 * @param foreignKeyValue - Defines ForeignKeyValue.
 * @param columns - Array of column object.
 * @hidden
 */
function getColumnByForeignKeyValue(foreignKeyValue, columns) {
    let column;
    return columns.some((col) => {
        column = col;
        return col.foreignKeyValue === foreignKeyValue;
    }) && column;
}
/**
 * @hidden
 * @param filterObject - Defines predicate model object
 */
function getDatePredicate(filterObject) {
    let datePredicate;
    let prevDate;
    let nextDate;
    let prevObj = extend({}, getActualProperties(filterObject));
    let nextObj = extend({}, getActualProperties(filterObject));
    let value = new Date(filterObject.value);
    if (filterObject.operator === 'equal' || filterObject.operator === 'notequal') {
        prevDate = new Date(value.setHours(0) - 1);
        nextDate = new Date(value.setHours(24));
        prevObj.value = prevDate;
        nextObj.value = nextDate;
        if (filterObject.operator === 'equal') {
            prevObj.operator = 'greaterthan';
            nextObj.operator = 'lessthan';
        }
        else if (filterObject.operator === 'notequal') {
            prevObj.operator = 'lessthanorequal';
            nextObj.operator = 'greaterthanorequal';
        }
        let predicateSt = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
        let predicateEnd = new Predicate(nextObj.field, nextObj.operator, nextObj.value, false);
        datePredicate = filterObject.operator === 'equal' ? predicateSt.and(predicateEnd) : predicateSt.or(predicateEnd);
    }
    else {
        if (typeof (prevObj.value) === 'string') {
            prevObj.value = new Date(prevObj.value);
        }
        let predicates = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
        datePredicate = predicates;
    }
    filterObject.ejpredicate = datePredicate;
    return datePredicate;
}
/**
 * @hidden
 */
function renderMovable(ele, frzCols) {
    let mEle = ele.cloneNode(true);
    for (let i = 0; i < frzCols; i++) {
        mEle.removeChild(mEle.children[0]);
    }
    for (let i = frzCols, len = ele.childElementCount; i < len; i++) {
        ele.removeChild(ele.children[ele.childElementCount - 1]);
    }
    return mEle;
}

/** @hidden */
const created = 'create';
/** @hidden */
const destroyed = 'destroy';
/** @hidden */
const load = 'load';
/** @hidden */
const rowDataBound = 'rowDataBound';
/** @hidden */
const queryCellInfo = 'queryCellInfo';
/** @hidden */
const actionBegin = 'actionBegin';
/** @hidden */
const actionComplete = 'actionComplete';
/** @hidden */
const actionFailure = 'actionFailure';
/** @hidden */
const dataBound = 'dataBound';
/** @hidden */
const rowSelecting = 'rowSelecting';
/** @hidden */
const rowSelected = 'rowSelected';
/** @hidden */
const rowDeselecting = 'rowDeselecting';
/** @hidden */
const rowDeselected = 'rowDeselected';
/** @hidden */
const cellSelecting = 'cellSelecting';
/** @hidden */
const cellSelected = 'cellSelected';
/** @hidden */
const cellDeselecting = 'cellDeselecting';
/** @hidden */
const cellDeselected = 'cellDeselected';
/** @hidden */
const columnDragStart = 'columnDragStart';
/** @hidden */
const columnDrag = 'columnDrag';
/** @hidden */
const columnDrop = 'columnDrop';
/** @hidden */
const rowDragStart = 'rowDragStart';
/** @hidden */
const rowDrag = 'rowDrag';
/** @hidden */
const rowDrop = 'rowDrop';
/** @hidden */
const beforePrint = 'beforePrint';
/** @hidden */
const printComplete = 'printComplete';
/** @hidden */
const detailDataBound = 'detailDataBound';
/** @hidden */
const toolbarClick = 'toolbarClick';
/** @hidden */
const batchAdd = 'batchAdd';
/** @hidden */
const batchCancel = 'batchCancel';
/** @hidden */
const batchDelete = 'batchDelete';
/** @hidden */
const beforeBatchAdd = 'beforeBatchAdd';
/** @hidden */
const beforeBatchDelete = 'beforeBatchDelete';
/** @hidden */
const beforeBatchSave = 'beforeBatchSave';
/** @hidden */
const beginEdit = 'beginEdit';
/** @hidden */
const cellEdit = 'cellEdit';
/** @hidden */
const cellSave = 'cellSave';
/** @hidden */
const endAdd = 'endAdd';
/** @hidden */
const endDelete = 'endDelete';
/** @hidden */
const endEdit = 'endEdit';
/** @hidden */
const recordDoubleClick = 'recordDoubleClick';
/** @hidden */
const recordClick = 'recordClick';
/** @hidden */
const beforeDataBound = 'beforeDataBound';
/** @hidden */
const beforeOpenColumnChooser = 'beforeOpenColumnChooser';
/** @hidden */
const resizeStart = 'resizeStart';
/** @hidden */
const onResize = 'resizing';
/** @hidden */
const resizeStop = 'resizeStop';
/** @hidden */
const checkBoxChange = 'checkBoxChange';
/** @hidden */
const beforeCopy = 'beforeCopy';
/** @hidden */
const filterChoiceRequest = 'filterchoicerequest';
/** @hidden */
const filterAfterOpen = 'filterafteropen';
/** @hidden */
const filterBeforeOpen = 'filterbeforeopen';
/**
 * Specifies grid internal events
 */
/** @hidden */
const initialLoad = 'initial-load';
/** @hidden */
const initialEnd = 'initial-end';
/** @hidden */
const dataReady = 'data-ready';
/** @hidden */
const contentReady = 'content-ready';
/** @hidden */
const uiUpdate = 'ui-update';
/** @hidden */
const onEmpty = 'on-empty';
/** @hidden */
const inBoundModelChanged = 'inbound-model-changed';
/** @hidden */
const modelChanged = 'model-changed';
/** @hidden */
const colGroupRefresh = 'colgroup-refresh';
/** @hidden */
const headerRefreshed = 'header-refreshed';
/** @hidden */
const pageBegin = 'paging-begin';
/** @hidden */
const pageComplete = 'paging-complete';
/** @hidden */
const sortBegin = 'sorting-begin';
/** @hidden */
const sortComplete = 'sorting-complete';
/** @hidden */
const filterBegin = 'filtering-begin';
/** @hidden */
const filterComplete = 'filtering-complete';
/** @hidden */
const searchBegin = 'searching-begin';
/** @hidden */
const searchComplete = 'searching-complete';
/** @hidden */
const reorderBegin = 'reorder-begin';
/** @hidden */
const reorderComplete = 'reorder-complete';
/** @hidden */
const rowDragAndDropBegin = 'rowdraganddrop-begin';
/** @hidden */
const rowDragAndDropComplete = 'rowdraganddrop-complete';
/** @hidden */
const groupBegin = 'grouping-begin';
/** @hidden */
const groupComplete = 'grouping-complete';
/** @hidden */
const ungroupBegin = 'ungrouping-begin';
/** @hidden */
const ungroupComplete = 'ungrouping-complete';
/** @hidden */
const rowSelectionBegin = 'rowselecting';
/** @hidden */
const rowSelectionComplete = 'rowselected';
/** @hidden */
const columnSelectionBegin = 'columnselecting';
/** @hidden */
const columnSelectionComplete = 'columnselected';
/** @hidden */
const cellSelectionBegin = 'cellselecting';
/** @hidden */
const cellSelectionComplete = 'cellselected';
/** @hidden */
const beforeCellFocused = 'beforecellfocused';
/** @hidden */
const cellFocused = 'cellfocused';
/** @hidden */
const keyPressed = 'key-pressed';
/** @hidden */
const click = 'click';
/** @hidden */
const destroy = 'destroy';
/** @hidden */
const columnVisibilityChanged = 'column-visible-changed';
/** @hidden */
const scroll = 'scroll';
/** @hidden */
const columnWidthChanged = 'column-width-changed';
/** @hidden */
const columnPositionChanged = 'column-position-changed';
/** @hidden */
const rowDragAndDrop = 'row-drag-and-drop';
/** @hidden */
const rowsAdded = 'rows-added';
/** @hidden */
const rowsRemoved = 'rows-removed';
/** @hidden */
const columnDragStop = 'column-drag-stop';
/** @hidden */
const headerDrop = 'header-drop';
/** @hidden */
const dataSourceModified = 'datasource-modified';
/** @hidden */
const refreshComplete = 'refresh-complete';
/** @hidden */
const refreshVirtualBlock = 'refresh-virtual-block';
/** @hidden */
const dblclick = 'dblclick';
/** @hidden */
const toolbarRefresh = 'toolbar-refresh';
/** @hidden */
const bulkSave = 'bulk-save';
/** @hidden */
const autoCol = 'auto-col';
/** @hidden */
const tooltipDestroy = 'tooltip-destroy';
/** @hidden */
const updateData = 'update-data';
/** @hidden */
const editBegin = 'edit-begin';
/** @hidden */
const editComplete = 'edit-complete';
/** @hidden */
const addBegin = 'add-begin';
/** @hidden */
const addComplete = 'add-complete';
/** @hidden */
const saveComplete = 'save-complete';
/** @hidden */
const deleteBegin = 'delete-begin';
/** @hidden */
const deleteComplete = 'delete-complete';
/** @hidden */
const preventBatch = 'prevent-batch';
/** @hidden */
const dialogDestroy = 'dialog-destroy';
/** @hidden */
const crudAction = 'crud-Action';
/** @hidden */
const addDeleteAction = 'add-delete-Action';
/** @hidden */
const destroyForm = 'destroy-form';
/** @hidden */
const doubleTap = 'double-tap';
/** @hidden */
const beforeExcelExport = 'beforeExcelExport';
/** @hidden */
const excelExportComplete = 'excelExportComplete';
/** @hidden */
const excelQueryCellInfo = 'excelQueryCellInfo';
/** @hidden */
const beforePdfExport = 'beforePdfExport';
/** @hidden */
const pdfExportComplete = 'pdfExportComplete';
/** @hidden */
const pdfQueryCellInfo = 'pdfQueryCellInfo';
/** @hidden */
const accessPredicate = 'access-predicate';
/** @hidden */
const contextMenuClick = 'contextMenuClick';
/** @hidden */
const freezeRender = 'freezerender';
/** @hidden */
const freezeRefresh = 'freezerefresh';
/** @hidden */
const contextMenuOpen = 'contextMenuOpen';
/** @hidden */
const columnMenuClick = 'columnMenuClick';
/** @hidden */
const columnMenuOpen = 'columnMenuOpen';
/** @hidden */
const filterOpen = 'filterOpen';
/** @hidden */
const filterDialogCreated = 'filterDialogCreated';
/** @hidden */
const filterMenuClose = 'filter-menu-close';
/** @hidden */
const initForeignKeyColumn = 'initForeignKeyColumn';
/** @hidden */
const getForeignKeyData = 'getForeignKeyData';
/** @hidden */
const generateQuery = 'generateQuery';
/** @hidden */
const showEmptyGrid = 'showEmptyGrid';
/** @hidden */
const foreignKeyData = 'foreignKeyData';
/** @hidden */
const dataStateChange = 'dataStateChange';
/** @hidden */
const dataSourceChanged = 'dataSourceChanged';
/** @hidden */
const rtlUpdated = 'rtl-updated';

/**
 * Defines types of Cell
 * @hidden
 */
var CellType;
(function (CellType) {
    /**  Defines CellType as Data */
    CellType[CellType["Data"] = 0] = "Data";
    /**  Defines CellType as Header */
    CellType[CellType["Header"] = 1] = "Header";
    /**  Defines CellType as Summary */
    CellType[CellType["Summary"] = 2] = "Summary";
    /**  Defines CellType as GroupSummary */
    CellType[CellType["GroupSummary"] = 3] = "GroupSummary";
    /**  Defines CellType as CaptionSummary */
    CellType[CellType["CaptionSummary"] = 4] = "CaptionSummary";
    /**  Defines CellType as Filter */
    CellType[CellType["Filter"] = 5] = "Filter";
    /**  Defines CellType as Indent */
    CellType[CellType["Indent"] = 6] = "Indent";
    /**  Defines CellType as GroupCaption */
    CellType[CellType["GroupCaption"] = 7] = "GroupCaption";
    /**  Defines CellType as GroupCaptionEmpty */
    CellType[CellType["GroupCaptionEmpty"] = 8] = "GroupCaptionEmpty";
    /**  Defines CellType as Expand */
    CellType[CellType["Expand"] = 9] = "Expand";
    /**  Defines CellType as HeaderIndent */
    CellType[CellType["HeaderIndent"] = 10] = "HeaderIndent";
    /**  Defines CellType as StackedHeader */
    CellType[CellType["StackedHeader"] = 11] = "StackedHeader";
    /**  Defines CellType as DetailHeader */
    CellType[CellType["DetailHeader"] = 12] = "DetailHeader";
    /**  Defines CellType as DetailExpand */
    CellType[CellType["DetailExpand"] = 13] = "DetailExpand";
    /**  Defines CellType as CommandColumn */
    CellType[CellType["CommandColumn"] = 14] = "CommandColumn";
})(CellType || (CellType = {}));
/**
 * Defines types of Render
 * @hidden
 */
var RenderType;
(function (RenderType) {
    /**  Defines RenderType as Header */
    RenderType[RenderType["Header"] = 0] = "Header";
    /**  Defines RenderType as Content */
    RenderType[RenderType["Content"] = 1] = "Content";
    /**  Defines RenderType as Summary */
    RenderType[RenderType["Summary"] = 2] = "Summary";
})(RenderType || (RenderType = {}));
/**
 * Defines Predefined toolbar items.
 * @hidden
 */
var ToolbarItem;
(function (ToolbarItem) {
    ToolbarItem[ToolbarItem["Add"] = 0] = "Add";
    ToolbarItem[ToolbarItem["Edit"] = 1] = "Edit";
    ToolbarItem[ToolbarItem["Update"] = 2] = "Update";
    ToolbarItem[ToolbarItem["Delete"] = 3] = "Delete";
    ToolbarItem[ToolbarItem["Cancel"] = 4] = "Cancel";
    ToolbarItem[ToolbarItem["Print"] = 5] = "Print";
    ToolbarItem[ToolbarItem["Search"] = 6] = "Search";
    ToolbarItem[ToolbarItem["ColumnChooser"] = 7] = "ColumnChooser";
    ToolbarItem[ToolbarItem["PdfExport"] = 8] = "PdfExport";
    ToolbarItem[ToolbarItem["ExcelExport"] = 9] = "ExcelExport";
    ToolbarItem[ToolbarItem["CsvExport"] = 10] = "CsvExport";
    ToolbarItem[ToolbarItem["WordExport"] = 11] = "WordExport";
})(ToolbarItem || (ToolbarItem = {}));

/* tslint:disable-next-line:max-line-length */
/**
 * @hidden
 * `CheckBoxFilter` module is used to handle filtering action.
 */
class CheckBoxFilter {
    /**
     * Constructor for checkbox filtering module
     * @hidden
     */
    constructor(parent, filterSettings, serviceLocator) {
        this.existingPredicate = {};
        this.filterState = true;
        this.defaultConstants = {
            Search: 'Search',
            OK: 'OK',
            Cancel: 'Cancel',
            Filter: 'Filter',
            Clear: 'Clear',
            SelectAll: 'Select All',
            Blanks: 'Blanks',
            True: 'True',
            False: 'False',
            NoResult: 'No Matches Found'
        };
        this.values = {};
        this.cBoxTrue = createCheckBox(false, { checked: true, label: ' ' });
        this.cBoxFalse = createCheckBox(false, { checked: false, label: ' ' });
        this.parent = parent;
        this.id = this.parent.element.id;
        this.serviceLocator = serviceLocator;
        this.filterSettings = filterSettings;
        this.valueFormatter = new ValueFormatter(this.parent.locale);
        this.initLocale(this.defaultConstants);
        this.cBoxTrue.insertBefore(createElement('input', {
            className: 'e-chk-hidden', attrs: { type: 'checkbox' }
        }), this.cBoxTrue.firstChild);
        this.cBoxFalse.insertBefore(createElement('input', {
            className: 'e-chk-hidden', attrs: { 'type': 'checkbox' }
        }), this.cBoxFalse.firstChild);
        this.cBoxFalse.querySelector('.e-frame').classList.add('e-uncheck');
        if (this.parent.enableRtl) {
            addClass([this.cBoxTrue, this.cBoxFalse], ['e-rtl']);
        }
    }
    initLocale(constants) {
        this.localeObj = new L10n(this.getModuleName(), this.defaultConstants, this.parent.locale || 'en-US');
    }
    /**
     * To destroy the filter bar.
     * @return {void}
     * @hidden
     */
    destroy() {
        this.closeDialog();
    }
    wireEvents() {
        EventHandler.add(this.dlg, 'click', this.clickHandler, this);
        EventHandler.add(this.dlg.querySelector('.e-searchinput'), 'keyup', this.searchBoxKeyUp, this);
    }
    unWireEvents() {
        EventHandler.remove(this.dlg, 'click', this.clickHandler);
        let elem = this.dlg.querySelector('.e-searchinput');
        if (elem) {
            EventHandler.remove(elem, 'keyup', this.searchBoxKeyUp);
        }
    }
    searchBoxClick(e) {
        let target = e.target;
        if (target.classList.contains('e-searchclear')) {
            this.sInput.value = '';
            this.refreshCheckboxes();
            this.updateSearchIcon();
            this.sInput.focus();
        }
    }
    searchBoxKeyUp(e) {
        this.refreshCheckboxes();
        this.updateSearchIcon();
    }
    updateSearchIcon() {
        if (this.sInput.value.length) {
            classList(this.sIcon, ['e-chkcancel-icon'], ['e-search-icon']);
        }
        else {
            classList(this.sIcon, ['e-search-icon'], ['e-chkcancel-icon']);
        }
    }
    /**
     * Gets the localized label by locale keyword.
     * @param  {string} key
     * @return {string}
     */
    getLocalizedLabel(key) {
        return this.localeObj.getConstant(key);
    }
    updateDataSource() {
        let dataSource = this.options.dataSource;
        if (!(dataSource instanceof DataManager)) {
            for (let i = 0; i < dataSource.length; i++) {
                if (typeof dataSource !== 'object') {
                    let obj = {};
                    obj[this.options.field] = dataSource[i];
                    dataSource[i] = obj;
                }
            }
        }
    }
    updateModel(options) {
        this.options = options;
        this.existingPredicate = options.actualPredicate || {};
        this.options.dataSource = options.dataSource;
        this.updateDataSource();
        this.options.type = options.type || 'string';
        this.options.format = options.format || '';
        this.options.filteredColumns = options.filteredColumns || this.parent.filterSettings.columns;
        this.options.sortedColumns = options.sortedColumns || this.parent.sortSettings.columns;
        this.options.query = options.query || new Query();
        this.options.allowCaseSensitive = options.allowCaseSensitive || false;
        this.values = {};
        this.isFiltered = options.filteredColumns.length;
        extend(this.defaultConstants, options.localizedStrings);
    }
    getAndSetChkElem(options) {
        this.dlg = createElement('div', {
            id: this.id + this.options.type + '_excelDlg',
            className: 'e-checkboxfilter e-filter-popup'
        });
        this.sBox = createElement('div', { className: 'e-searchcontainer' });
        if (!options.hideSearchbox) {
            this.sInput = createElement('input', {
                id: this.id + '_SearchBox',
                className: 'e-searchinput'
            });
            this.sIcon = createElement('span', {
                className: 'e-searchclear e-search-icon e-icons e-input-group-icon', attrs: {
                    type: 'text', placeholder: this.getLocalizedLabel('Search')
                }
            });
            this.searchBox = createElement('span', { className: 'e-searchbox e-fields' });
            this.searchBox.appendChild(this.sInput);
            this.sBox.appendChild(this.searchBox);
            Input.createInput({
                element: this.sInput, floatLabelType: 'Never', properties: {
                    placeholder: this.getLocalizedLabel('Search')
                }
            });
            this.searchBox.querySelector('.e-input-group').appendChild(this.sIcon);
        }
        this.spinner = createElement('div', { className: 'e-spinner' }); //for spinner
        this.cBox = createElement('div', {
            id: this.id + this.options.type + '_CheckBoxList',
            className: 'e-checkboxlist e-fields'
        });
        this.spinner.appendChild(this.cBox);
        this.sBox.appendChild(this.spinner);
        return this.sBox;
    }
    showDialog(options) {
        let args = {
            requestType: filterBeforeOpen, filterModel: this,
            columnName: this.options.field, columnType: this.options.type, cancel: false
        };
        this.parent.trigger(actionBegin, args);
        if (args.cancel) {
            return;
        }
        this.dialogObj = new Dialog({
            visible: false, content: this.sBox,
            close: this.closeDialog.bind(this),
            width: (!isNullOrUndefined(parentsUntil(options.target, 'e-bigger')))
                || this.parent.element.classList.contains('e-device') ? 260 : 255,
            target: this.parent.element, animationSettings: { effect: 'None' },
            buttons: [{
                    click: this.btnClick.bind(this),
                    buttonModel: { content: this.getLocalizedLabel(this.isExcel ? 'OK' : 'Filter'), cssClass: 'e-primary', isPrimary: true }
                },
                {
                    click: this.btnClick.bind(this),
                    buttonModel: { cssClass: 'e-flat', content: this.getLocalizedLabel(this.isExcel ? 'Cancel' : 'Clear') }
                }],
            created: this.dialogCreated.bind(this),
            open: this.dialogOpen.bind(this)
        });
        this.dialogObj.appendTo(this.dlg);
        this.dialogObj.element.style.maxHeight = '800px';
        this.dialogObj.show();
        this.wireEvents();
        createSpinner({ target: this.spinner });
        showSpinner(this.spinner);
        this.getAllData();
    }
    dialogCreated(e) {
        if (!Browser.isDevice) {
            getFilterMenuPostion(this.options.target, this.dialogObj, this.parent);
        }
        else {
            this.dialogObj.position = { X: 'center', Y: 'center' };
        }
        this.parent.notify(filterDialogCreated, e);
    }
    openDialog(options) {
        this.updateModel(options);
        this.getAndSetChkElem(options);
        this.showDialog(options);
    }
    closeDialog() {
        if (this.dialogObj && !this.dialogObj.isDestroyed) {
            this.parent.notify(filterMenuClose, { field: this.options.field });
            this.dialogObj.destroy();
            this.unWireEvents();
            remove(this.dlg);
            this.dlg = null;
        }
    }
    clearFilter() {
        this.options.handler({ action: 'clear-filter', field: this.options.field });
    }
    btnClick(e) {
        if (this.filterState) {
            if (e.target.tagName.toLowerCase() === 'input') {
                let args = {
                    action: 'filtering', filterCollection: {
                        field: this.options.field,
                        operator: this.options.column.type === 'date' || this.options.column.type === 'datetime' ? 'equal' : 'contains',
                        value: e.target.value, matchCase: false, type: this.options.column.type
                    },
                    field: this.options.field
                };
                e.target.value ? this.options.handler(args) : this.closeDialog();
            }
            else {
                let text = e.target.firstChild.textContent.toLowerCase();
                if (this.getLocalizedLabel(this.isExcel ? 'OK' : 'Filter').toLowerCase() === text) {
                    this.fltrBtnHandler();
                }
                else if (this.getLocalizedLabel('Clear').toLowerCase() === text) {
                    this.clearFilter();
                }
            }
            this.closeDialog();
        }
        else if (!(e.target.tagName.toLowerCase() === 'input')) {
            this.clearFilter();
            this.closeDialog();
        }
    }
    fltrBtnHandler() {
        let checked = [].slice.call(this.cBox.querySelectorAll('.e-check:not(.e-selectall)'));
        let optr = 'equal';
        let caseSen = this.options.type === 'string' ?
            this.options.allowCaseSensitive : true;
        let defaults = {
            field: this.options.field, predicate: 'or',
            operator: optr, matchCase: caseSen, ignoreAccent: this.parent.filterSettings.ignoreAccent
        };
        let isNotEqual = this.itemsCnt !== checked.length && this.itemsCnt - checked.length < checked.length;
        if (isNotEqual) {
            optr = 'notequal';
            checked = [].slice.call(this.cBox.querySelectorAll('.e-uncheck:not(.e-selectall)'));
            defaults.predicate = 'and';
            defaults.operator = 'notequal';
        }
        let value;
        let fObj;
        let coll = [];
        let searchInput = this.searchBox.querySelector('.e-searchinput');
        if (checked.length !== this.itemsCnt || (searchInput.value && searchInput.value !== '')) {
            for (let i = 0; i < checked.length; i++) {
                value = this.values[parentsUntil(checked[i], 'e-ftrchk').getAttribute('uid')];
                fObj = extend({}, { value: value }, defaults);
                if (value && !value.toString().length) {
                    fObj.operator = isNotEqual ? 'notequal' : 'equal';
                }
                coll.push(fObj);
            }
            this.initiateFilter(coll);
        }
        else {
            this.clearFilter();
        }
    }
    initiateFilter(fColl) {
        let firstVal = fColl[0];
        let predicate;
        if (!isNullOrUndefined(firstVal)) {
            predicate = firstVal.ejpredicate ? firstVal.ejpredicate :
                new Predicate(firstVal.field, firstVal.operator, firstVal.value, !firstVal.matchCase, firstVal.ignoreAccent);
            for (let j = 1; j < fColl.length; j++) {
                predicate = fColl[j].ejpredicate !== undefined ?
                    predicate[fColl[j].predicate](fColl[j].ejpredicate) :
                    predicate[fColl[j].predicate](fColl[j].field, fColl[j].operator, fColl[j].value, !fColl[j].matchCase, fColl[j].ignoreAccent);
            }
            let args = {
                action: 'filtering', filterCollection: fColl, field: this.options.field,
                ejpredicate: Predicate.or(predicate)
            };
            this.options.handler(args);
        }
    }
    refreshCheckboxes() {
        let val = this.sInput.value;
        let query = this.options.query.clone();
        let parsed = (this.options.type !== 'string' && parseFloat(val)) ? parseFloat(val) : val;
        let operator = 'contains';
        let matchCase = true;
        let ignoreAccent = this.parent.filterSettings.ignoreAccent;
        parsed = (parsed === '' || parsed === undefined) ? undefined : parsed;
        let predicte;
        if (this.options.type === 'boolean') {
            if (parsed !== undefined &&
                this.getLocalizedLabel('True').toLowerCase().indexOf(parsed.toLowerCase()) !== -1) {
                parsed = 'true';
            }
            else if (parsed !== undefined &&
                this.getLocalizedLabel('False').toLowerCase().indexOf(parsed.toLowerCase()) !== -1) {
                parsed = 'false';
            }
        }
        predicte = new Predicate(this.options.field, operator, parsed, matchCase, ignoreAccent);
        if (this.options.type === 'date' || this.options.type === 'datetime') {
            parsed = this.valueFormatter.fromView(val, this.options.parserFn, this.options.type);
            operator = 'equal';
            if (isNullOrUndefined(parsed) && val.length) {
                return;
            }
            predicte = getDatePredicate({
                field: this.options.field, operator: operator, value: parsed, matchCase: matchCase,
                ignoreAccent: ignoreAccent
            });
        }
        if (val.length) {
            query.where(predicte);
        }
        this.processDataSource(query);
    }
    getPredicateFromCols(columns) {
        let predicates = CheckBoxFilter.getPredicate(columns);
        let predicateList = [];
        let fPredicate = {};
        let foreignColumn = this.parent.getForeignKeyColumns();
        for (let prop of Object.keys(predicates)) {
            let col = getColumnByForeignKeyValue(prop, foreignColumn);
            if (col) {
                this.parent.notify(generateQuery, { predicate: fPredicate, column: col });
                if (fPredicate.predicate.predicates.length) {
                    predicateList.push(Predicate.or(fPredicate.predicate.predicates));
                }
            }
            else {
                predicateList.push(predicates[prop]);
            }
        }
        return predicateList.length && Predicate.and(predicateList);
    }
    getAllData() {
        let query = new Query();
        query.requiresCount(); //consider take query
        this.options.dataSource = this.options.dataSource instanceof DataManager ?
            this.options.dataSource : new DataManager(this.options.dataSource);
        let allPromise = [];
        let runArray = [];
        if (this.options.column.isForeignColumn()) {
            allPromise.push(this.options.column.dataSource.executeQuery(new Query()));
            runArray.push((data) => this.foreignKeyData = data);
        }
        allPromise.push(this.options.dataSource.executeQuery(query));
        runArray.push(this.dataSuccess.bind(this));
        let i = 0;
        Promise.all(allPromise).then((e) => {
            e.forEach((data) => {
                runArray[i++](data.result);
            });
        });
    }
    dataSuccess(e) {
        this.fullData = e;
        let query = new Query();
        if ((this.options.filteredColumns.length)) {
            let cols = [];
            for (let i = 0; i < this.options.filteredColumns.length; i++) {
                if (!(this.options.filteredColumns[i].field === this.options.field ||
                    this.options.filteredColumns[i].field === this.options.foreignKeyValue)) {
                    cols.push(this.options.filteredColumns[i]);
                }
            }
            let predicate = this.getPredicateFromCols(cols);
            if (predicate) {
                query.where(predicate);
            }
        }
        // query.select(this.options.field);
        let result = new DataManager(this.fullData).executeLocal(query);
        let col = this.options.column;
        let res = CheckBoxFilter.getDistinct(result, this.options.field, col, this.foreignKeyData);
        this.filteredData = res.records;
        this.processDataSource(null, true);
        this.dialogObj.element.querySelector('.e-searchinput').focus();
        let args = {
            requestType: filterAfterOpen,
            filterModel: this, columnName: this.options.field, columnType: this.options.type
        };
        this.parent.trigger(actionComplete, args);
    }
    processDataSource(query, isInitial) {
        showSpinner(this.spinner);
        query = query ? query : this.options.query.clone();
        query.requiresCount();
        let args = {
            requestType: filterChoiceRequest, filterModel: this, query: query,
            dataSource: this.filteredData
        };
        this.parent.trigger(actionBegin, args);
        let result = new DataManager(args.dataSource).executeLocal(args.query);
        let res = result;
        this.updateResult();
        this.createFilterItems(res.result, isInitial);
    }
    updateResult() {
        this.result = {};
        let predicate = this.getPredicateFromCols(this.options.filteredColumns);
        let query = new Query();
        if (predicate) {
            query.where(predicate);
        }
        let result = new DataManager(this.fullData).executeLocal(query);
        for (let res of result) {
            this.result[getValue(this.options.field, res)] = true;
        }
    }
    clickHandler(e) {
        let target = e.target;
        let elem = parentsUntil(target, 'e-checkbox-wrapper');
        if (parentsUntil(target, 'e-searchbox')) {
            this.searchBoxClick(e);
        }
        if (elem) {
            let selectAll = elem.querySelector('.e-selectall');
            if (selectAll) {
                this.updateAllCBoxes(!selectAll.classList.contains('e-check'));
            }
            else {
                toogleCheckbox(elem.parentElement);
            }
            this.updateIndeterminatenBtn();
            elem.querySelector('.e-chk-hidden').focus();
        }
    }
    updateAllCBoxes(checked) {
        let cBoxes = [].slice.call(this.cBox.querySelectorAll('.e-frame'));
        for (let cBox of cBoxes) {
            removeAddCboxClasses(cBox, checked);
        }
    }
    dialogOpen() {
        if (this.parent.element.classList.contains('e-device')) {
            this.dialogObj.element.querySelector('.e-input-group').classList.remove('e-input-focus');
            this.dialogObj.element.querySelector('.e-btn').focus();
        }
    }
    createCheckbox(value, checked) {
        let elem = checked ? this.cBoxTrue.cloneNode(true) :
            this.cBoxFalse.cloneNode(true);
        let label = elem.querySelector('.e-label');
        label.innerHTML = !isNullOrUndefined(value) && value.toString().length ? value :
            this.getLocalizedLabel('Blanks');
        if (this.options.template) {
            label.innerHTML = '';
            let args = {};
            args[this.options.field] = value;
            appendChildren(label, this.options.template(args));
        }
        return elem;
    }
    updateIndeterminatenBtn() {
        let cnt = this.cBox.children.length - 1;
        let className = [];
        let elem = this.cBox.querySelector('.e-selectall');
        let selected = this.cBox.querySelectorAll('.e-check:not(.e-selectall)').length;
        let btn = this.dlg.querySelector('.e-footer-content').querySelector('.e-btn').ej2_instances[0];
        btn.disabled = false;
        if (cnt === selected) {
            className = ['e-check'];
        }
        else if (selected) {
            className = ['e-stop'];
        }
        else {
            className = ['e-uncheck'];
            btn.disabled = true;
        }
        this.filterState = !btn.disabled;
        btn.dataBind();
        removeClass([elem], ['e-check', 'e-stop', 'e-uncheck']);
        addClass([elem], className);
    }
    createFilterItems(data, isInitial) {
        let cBoxes = createElement('div');
        let btn = this.dlg.querySelector('.e-footer-content').querySelector('.e-btn').ej2_instances[0];
        this.itemsCnt = data.length;
        if (data.length) {
            let selectAll = createCboxWithWrap(getUid('cbox'), this.createCheckbox(this.getLocalizedLabel('SelectAll'), false), 'e-ftrchk');
            selectAll.querySelector('.e-frame').classList.add('e-selectall');
            cBoxes.appendChild(selectAll);
            let predicate = new Predicate('field', 'equal', this.options.field);
            if (this.options.foreignKeyValue) {
                predicate = predicate.or('field', 'equal', this.options.foreignKeyValue);
            }
            let isColFiltered = new DataManager(this.options.filteredColumns).executeLocal(new Query().where(predicate)).length;
            for (let i = 0; i < data.length; i++) {
                let uid = getUid('cbox');
                this.values[uid] = getValue('ejValue', data[i]);
                let value = this.valueFormatter.toView(getValue(this.options.field, data[i]), this.options.formatFn);
                cBoxes.appendChild(createCboxWithWrap(uid, this.createCheckbox(value, this.getCheckedState(isColFiltered, this.values[uid])), 'e-ftrchk'));
            }
            this.cBox.innerHTML = cBoxes.innerHTML;
            this.updateIndeterminatenBtn();
            btn.disabled = false;
        }
        else {
            cBoxes.appendChild(createElement('span', { innerHTML: this.getLocalizedLabel('NoResult') }));
            this.cBox.innerHTML = cBoxes.innerHTML;
            btn.disabled = true;
        }
        this.filterState = !btn.disabled;
        btn.dataBind();
        let args = { requestType: filterChoiceRequest, filterModel: this, dataSource: data };
        this.parent.trigger(actionComplete, args);
        hideSpinner(this.spinner);
    }
    getCheckedState(isColFiltered, value) {
        if (!this.isFiltered || !isColFiltered) {
            return true;
        }
        else {
            return this.result[value];
        }
    }
    static getDistinct(json, field, column, foreignKeyData$$1) {
        let len = json.length;
        let result = [];
        let value;
        let ejValue = 'ejValue';
        let lookup = {};
        let isForeignKey = column && column.isForeignColumn();
        while (len--) {
            value = json[len];
            value = getValue(field, value); //local remote diff, check with mdu           
            if (!isNullOrUndefined(value)) {
                if (!(value in lookup)) {
                    let obj = {};
                    obj[ejValue] = value;
                    lookup[value] = true;
                    value = isForeignKey ? getValue(column.foreignKeyValue, getForeignData(column, {}, value, foreignKeyData$$1)[0]) : value;
                    setValue(field, isNullOrUndefined(value) ? null : value, obj);
                    result.push(obj);
                }
            }
        }
        return DataUtil.group(DataUtil.sort(result, field, DataUtil.fnAscending), 'ejValue');
    }
    static getPredicate(columns) {
        let cols = CheckBoxFilter.getDistinct(columns, 'field').records;
        let collection = [];
        let pred = {};
        for (let i = 0; i < cols.length; i++) {
            collection = new DataManager(columns).executeLocal(new Query().where('field', 'equal', cols[i].field));
            if (collection.length !== 0) {
                pred[cols[i].field] = CheckBoxFilter.generatePredicate(collection);
            }
        }
        return pred;
    }
    static generatePredicate(cols) {
        let len = cols ? cols.length : 0;
        let predicate;
        let first;
        first = CheckBoxFilter.updateDateFilter(cols[0]);
        first.ignoreAccent = !isNullOrUndefined(first.ignoreAccent) ? first.ignoreAccent : false;
        if (first.type === 'date' || first.type === 'datetime') {
            predicate = getDatePredicate(first);
        }
        else {
            predicate = first.ejpredicate ? first.ejpredicate :
                new Predicate(first.field, first.operator, first.value, !CheckBoxFilter.getCaseValue(first), first.ignoreAccent);
        }
        for (let p = 1; p < len; p++) {
            cols[p] = CheckBoxFilter.updateDateFilter(cols[p]);
            if (len > 2 && p > 1 && cols[p].predicate === 'or') {
                if (cols[p].type === 'date' || cols[p].type === 'datetime') {
                    predicate.predicates.push(getDatePredicate(cols[p]));
                }
                else {
                    predicate.predicates.push(new Predicate(cols[p].field, cols[p].operator, cols[p].value, !CheckBoxFilter.getCaseValue(cols[p]), cols[p].ignoreAccent));
                }
            }
            else {
                if (cols[p].type === 'date' || cols[p].type === 'datetime') {
                    predicate = predicate[(cols[p].predicate)](getDatePredicate(cols[p]), cols[p].ignoreAccent);
                }
                else {
                    predicate = cols[p].ejpredicate ?
                        predicate[cols[p].predicate](cols[p].ejpredicate) :
                        predicate[(cols[p].predicate)](cols[p].field, cols[p].operator, cols[p].value, CheckBoxFilter.getCaseValue(cols[p]), cols[p].ignoreAccent);
                }
            }
        }
        return predicate || null;
    }
    static getCaseValue(filter) {
        if (isNullOrUndefined(filter.matchCase)) {
            return true;
        }
        else {
            return filter.matchCase;
        }
    }
    static updateDateFilter(filter) {
        if ((filter.type === 'date' || filter.type === 'datetime' || filter.value instanceof Date)) {
            filter.type = filter.type || 'date';
        }
        return filter;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'checkboxFilter';
    }
}

/**
 * Grid data module is used to generate query and data source.
 * @hidden
 */
class Data {
    /**
     * Constructor for data module.
     * @hidden
     */
    constructor(parent, serviceLocator) {
        this.dataState = { isPending: false, resolver: null, group: [] };
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.initDataManager();
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(rowsAdded, this.addRows, this);
        this.parent.on(rowsRemoved, this.removeRows, this);
        this.parent.on(dataSourceModified, this.initDataManager, this);
        this.parent.on(destroy, this.destroy, this);
        this.parent.on(updateData, this.crudActions, this);
        this.parent.on(addDeleteAction, this.getData, this);
    }
    /**
     * The function used to initialize dataManager and external query
     * @return {void}
     */
    initDataManager() {
        let gObj = this.parent;
        this.dataManager = gObj.dataSource instanceof DataManager ? gObj.dataSource :
            (isNullOrUndefined(gObj.dataSource) ? new DataManager() : new DataManager(gObj.dataSource));
        gObj.query = gObj.query instanceof Query ? gObj.query : new Query();
    }
    /**
     * The function is used to generate updated Query from Grid model.
     * @return {Query}
     * @hidden
     */
    generateQuery(skipPage) {
        let gObj = this.parent;
        let query = gObj.query.clone();
        this.filterQuery(query);
        this.searchQuery(query);
        this.aggregateQuery(query);
        this.sortQuery(query);
        this.pageQuery(query, skipPage);
        this.groupQuery(query);
        return query;
    }
    aggregateQuery(query, isForeign) {
        this.parent.aggregates.forEach((row) => {
            row.columns.forEach((column) => {
                let types = column.type instanceof Array ? column.type : [column.type];
                types.forEach((type) => query.aggregate(type.toLowerCase(), column.field));
            });
        });
        return query;
    }
    pageQuery(query, skipPage) {
        let gObj = this.parent;
        if ((gObj.allowPaging || gObj.enableVirtualization) && skipPage !== true) {
            gObj.pageSettings.currentPage = Math.max(1, gObj.pageSettings.currentPage);
            if (gObj.pageSettings.pageCount <= 0) {
                gObj.pageSettings.pageCount = 8;
            }
            if (gObj.pageSettings.pageSize <= 0) {
                gObj.pageSettings.pageSize = 12;
            }
            query.page(gObj.pageSettings.currentPage, gObj.pageSettings.pageSize);
        }
        return query;
    }
    groupQuery(query) {
        let gObj = this.parent;
        if (gObj.allowGrouping && gObj.groupSettings.columns.length) {
            let columns = gObj.groupSettings.columns;
            for (let i = 0, len = columns.length; i < len; i++) {
                let column = this.getColumnByField(columns[i]);
                let isGrpFmt = column.enableGroupByFormat;
                let format = column.format;
                if (isGrpFmt) {
                    query.group(columns[i], this.formatGroupColumn.bind(this), format);
                }
                else {
                    query.group(columns[i], null);
                }
            }
        }
        return query;
    }
    sortQuery(query) {
        let gObj = this.parent;
        if ((gObj.allowSorting || gObj.allowGrouping) && gObj.sortSettings.columns.length) {
            let columns = gObj.sortSettings.columns;
            let sortGrp = [];
            for (let i = columns.length - 1; i > -1; i--) {
                let col = this.getColumnByField(columns[i].field);
                col.setSortDirection(columns[i].direction);
                let fn = col.sortComparer && !this.isRemote() ? col.sortComparer.bind(col) : columns[i].direction;
                if (gObj.groupSettings.columns.indexOf(columns[i].field) === -1) {
                    query.sortBy(col.field, fn);
                }
                else {
                    sortGrp.push({ direction: fn, field: col.field });
                }
            }
            for (let i = 0, len = sortGrp.length; i < len; i++) {
                query.sortBy(sortGrp[i].field, sortGrp[i].direction);
            }
        }
        return query;
    }
    searchQuery(query) {
        let sSettings = this.parent.searchSettings;
        let fields = sSettings.fields.length ? sSettings.fields : this.parent.getColumns().map((f) => f.field);
        let predicateList = [];
        if (this.parent.searchSettings.key.length) {
            if (this.parent.getForeignKeyColumns().length) {
                fields.forEach((columnName) => {
                    let column = this.getColumnByField(columnName);
                    let sQuery = new Query();
                    if (column.isForeignColumn()) {
                        predicateList = this.fGeneratePredicate(column, predicateList);
                    }
                    else {
                        predicateList.push(new Predicate(column.field, sSettings.operator, sSettings.key, sSettings.ignoreCase, this.parent.filterSettings.ignoreAccent));
                    }
                });
                query.where(Predicate.or(predicateList));
            }
            else {
                query.search(sSettings.key, fields, sSettings.operator, sSettings.ignoreCase, this.parent.filterSettings.ignoreAccent);
            }
        }
        return query;
    }
    filterQuery(query, column, skipFoerign) {
        let gObj = this.parent;
        let predicateList = [];
        let actualFilter = [];
        let foreignColumn = this.parent.getForeignKeyColumns();
        if (gObj.allowFiltering && gObj.filterSettings.columns.length) {
            let columns = column ? column : gObj.filterSettings.columns;
            let colType = {};
            for (let col of gObj.columns) {
                colType[col.field] = col.filter.type ? col.filter.type : gObj.filterSettings.type;
            }
            let checkBoxCols = [];
            let defaultFltrCols = [];
            for (let col of columns) {
                if (colType[col.field] === 'CheckBox' || colType[col.field] === 'Excel') {
                    checkBoxCols.push(col);
                }
                else {
                    defaultFltrCols.push(col);
                }
            }
            if (checkBoxCols.length) {
                let excelPredicate = CheckBoxFilter.getPredicate(checkBoxCols);
                for (let prop of Object.keys(excelPredicate)) {
                    let col = getColumnByForeignKeyValue(prop, foreignColumn);
                    if (col && !skipFoerign) {
                        predicateList = this.fGeneratePredicate(col, predicateList);
                        actualFilter.push(col);
                    }
                    else {
                        predicateList.push(excelPredicate[prop]);
                    }
                }
            }
            if (defaultFltrCols.length) {
                for (let col of defaultFltrCols) {
                    let column = this.getColumnByField(col.field) ||
                        getColumnByForeignKeyValue(col.field, this.parent.getForeignKeyColumns());
                    let sType = column.type;
                    if (getColumnByForeignKeyValue(col.field, foreignColumn) && !skipFoerign) {
                        actualFilter.push(col);
                        predicateList = this.fGeneratePredicate(column, predicateList);
                    }
                    else {
                        if (sType !== 'date' && sType !== 'datetime') {
                            predicateList.push(new Predicate(col.field, col.operator, col.value, !col.matchCase, this.parent.filterSettings.ignoreAccent));
                        }
                        else {
                            predicateList.push(getDatePredicate(col));
                        }
                    }
                }
            }
            if (predicateList.length) {
                query.where(Predicate.and(predicateList));
            }
            else {
                this.parent.notify(showEmptyGrid, {});
            }
        }
        return query;
    }
    fGeneratePredicate(col, predicateList) {
        let fPredicate = {};
        if (col) {
            this.parent.notify(generateQuery, { predicate: fPredicate, column: col });
            if (fPredicate.predicate.predicates.length) {
                predicateList.push(fPredicate.predicate);
            }
        }
        return predicateList;
    }
    /**
     * The function is used to get dataManager promise by executing given Query.
     * @param  {Query} query - Defines the query which will execute along with data processing.
     * @return {Promise<Object>}
     * @hidden
     */
    getData(args = { requestType: '' }, query) {
        let key = this.getKey(args.foreignKeyData &&
            Object.keys(args.foreignKeyData).length ?
            args.foreignKeyData : this.parent.getPrimaryKeyFieldNames());
        if (this.parent.dataSource && 'result' in this.parent.dataSource) {
            let def = this.eventPromise(args, query, key);
            return def.promise;
        }
        else {
            switch (args.requestType) {
                case 'delete':
                    query = query ? query : this.generateQuery();
                    this.dataManager.remove(key, args.data[0], null, query);
                    break;
                case 'save':
                    query = query ? query : this.generateQuery();
                    args.index = isNullOrUndefined(args.index) ? 0 : args.index;
                    this.dataManager.insert(args.data, null, query, args.index);
                    break;
            }
            if (this.dataManager.ready) {
                let deferred = new Deferred();
                let ready = this.dataManager.ready;
                ready.then((e) => {
                    this.dataManager.executeQuery(query).then((result) => {
                        deferred.resolve(result);
                    });
                }).catch((e) => {
                    deferred.reject(e);
                });
                return deferred.promise;
            }
            else {
                return this.dataManager.executeQuery(query);
            }
        }
    }
    formatGroupColumn(value, field) {
        let gObj = this.parent;
        let serviceLocator = this.serviceLocator;
        let column = this.getColumnByField(field);
        let date = value;
        if (!column.type) {
            column.type = date.getDay ? (date.getHours() > 0 || date.getMinutes() > 0 ||
                date.getSeconds() > 0 || date.getMilliseconds() > 0 ? 'datetime' : 'date') : typeof (value);
        }
        if (isNullOrUndefined(column.getFormatter())) {
            setFormatter(serviceLocator, column);
        }
        let formatVal = ValueFormatter.prototype.toView(value, column.getFormatter());
        return formatVal;
    }
    crudActions(args) {
        let query = this.generateQuery();
        let promise = null;
        let pr = 'promise';
        let key = this.getKey(args.foreignKeyData &&
            Object.keys(args.foreignKeyData).length ? args.foreignKeyData :
            this.parent.getPrimaryKeyFieldNames());
        if (this.parent.dataSource && 'result' in this.parent.dataSource) {
            this.eventPromise(args, query, key);
        }
        switch (args.requestType) {
            case 'save':
                promise = this.dataManager.update(key, args.data, null, this.generateQuery());
                break;
        }
        args[pr] = promise;
        this.parent.notify(crudAction, args);
    }
    /** @hidden */
    saveChanges(changes, key) {
        let query = this.generateQuery().requiresCount();
        if ('result' in this.parent.dataSource) {
            let state;
            state = this.getStateEventArgument(query);
            let deff = new Deferred();
            let args = {
                requestType: 'batchsave', changes: changes, key: key, query: query,
                endEdit: deff.resolve
            };
            this.setState({ isPending: true, resolver: deff.resolve });
            this.parent.trigger(dataSourceChanged, args);
            return deff.promise;
        }
        else {
            let promise = this.dataManager.saveChanges(changes, key, null, this.generateQuery().requiresCount());
            return promise;
        }
    }
    getKey(keys) {
        if (keys && keys.length) {
            return keys[0];
        }
        return undefined;
    }
    /** @hidden */
    isRemote() {
        return this.dataManager.dataSource.offline !== true && this.dataManager.dataSource.url !== undefined;
    }
    addRows(e) {
        for (let i = e.records.length; i > 0; i--) {
            this.dataManager.dataSource.json.splice(e.toIndex, 0, e.records[i - 1]);
        }
    }
    removeRows(e) {
        let json = this.dataManager.dataSource.json;
        this.dataManager.dataSource.json = json.filter((value, index) => e.records.indexOf(value) === -1);
    }
    getColumnByField(field) {
        let col;
        return (this.parent.columnModel).some((column) => {
            col = column;
            return column.field === field;
        }) && col;
    }
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(rowsAdded, this.addRows);
        this.parent.off(rowsRemoved, this.removeRows);
        this.parent.off(dataSourceModified, this.initDataManager);
        this.parent.off(dataSourceModified, this.destroy);
        this.parent.off(updateData, this.crudActions);
        this.parent.off(addDeleteAction, this.getData);
    }
    getState() {
        return this.dataState;
    }
    setState(state) {
        return this.dataState = state;
    }
    getStateEventArgument(query) {
        let adaptr = new UrlAdaptor();
        let dm = new DataManager({ url: '', adaptor: new UrlAdaptor });
        let state = adaptr.processQuery(dm, query);
        return JSON.parse(state.data);
    }
    eventPromise(args, query, key) {
        let state;
        let dataArgs = args;
        state = this.getStateEventArgument(query);
        let def = new Deferred();
        let deff = new Deferred();
        if (args.requestType !== undefined && args.requestType !== 'refresh') {
            state.action = args;
            if (args.requestType === 'save' || args.requestType === 'delete') {
                let editArgs = args;
                editArgs.key = key;
                editArgs.state = state;
                this.setState({ isPending: true, resolver: deff.resolve });
                dataArgs.endEdit = deff.resolve;
                this.parent.trigger(dataSourceChanged, editArgs);
                deff.promise.then((e) => {
                    this.setState({ isPending: true, resolver: def.resolve, group: state.group });
                    this.parent.trigger(dataStateChange, state);
                });
            }
            else {
                this.setState({ isPending: true, resolver: def.resolve, group: state.group });
                this.parent.trigger(dataStateChange, state);
            }
        }
        else {
            this.setState({});
            def.resolve(this.parent.dataSource);
        }
        return def;
    }
}

/**
 * Row
 * @hidden
 */
class Row {
    constructor(options) {
        merge(this, options);
    }
    clone() {
        let row = new Row({});
        merge(row, this);
        row.cells = this.cells.map((cell) => cell.clone());
        return row;
    }
}

/**
 * Cell
 * @hidden
 */
class Cell {
    constructor(options) {
        this.isSpanned = false;
        merge(this, options);
    }
    clone() {
        let cell = new Cell({});
        merge(cell, this);
        return cell;
    }
}

/**
 * `CellMergeRender` module.
 * @hidden
 */
class CellMergeRender {
    constructor(serviceLocator, parent) {
        this.serviceLocator = serviceLocator;
        this.parent = parent;
    }
    render(cellArgs, row, i, td) {
        let cellRendererFact = this.serviceLocator.getService('cellRendererFactory');
        let cellRenderer = cellRendererFact.getCellRenderer(row.cells[i].cellType || CellType.Data);
        let span = row.cells[i].cellSpan ? row.cells[i].cellSpan :
            (cellArgs.colSpan + i) <= row.cells.length ? cellArgs.colSpan : row.cells.length - i;
        let visible = 0;
        for (let j = i + 1; j < i + span && j < row.cells.length; j++) {
            if (row.cells[j].visible === false) {
                visible++;
            }
            else {
                row.cells[j].isSpanned = true;
            }
        }
        if (visible > 0) {
            for (let j = i + span; j < i + span + visible && j < row.cells.length; j++) {
                row.cells[j].isSpanned = true;
            }
            if (i + span + visible >= row.cells.length) {
                span -= (i + span + visible) - row.cells.length;
            }
        }
        if (row.cells[i].cellSpan) {
            row.data[cellArgs.column.field] = row.cells[i].spanText;
            td = cellRenderer.render(row.cells[i], row.data, { 'index': !isNullOrUndefined(row.index) ? row.index.toString() : '' });
        }
        if (span > 1) {
            attributes(td, { 'colSpan': span.toString(), 'aria-colSpan': span.toString() });
        }
        if (this.parent.enableColumnVirtualization && !row.cells[i].cellSpan &&
            !this.containsKey(cellArgs.column.field, cellArgs.data[cellArgs.column.field])) {
            this.backupMergeCells(cellArgs.column.field, cellArgs.data[cellArgs.column.field], cellArgs.colSpan);
        }
        return td;
    }
    backupMergeCells(fName, data, span) {
        this.setMergeCells(this.generteKey(fName, data), span);
    }
    generteKey(fname, data) {
        return fname + '__' + data.toString();
    }
    splitKey(key) {
        return key.split('__');
    }
    containsKey(fname, data) {
        return this.getMergeCells().hasOwnProperty(this.generteKey(fname, data));
    }
    getMergeCells() {
        return this.parent.mergeCells;
    }
    setMergeCells(key, span) {
        this.parent.mergeCells[key] = span;
    }
    updateVirtualCells(rows) {
        let mCells = this.getMergeCells();
        for (let key of Object.keys(mCells)) {
            let value = mCells[key];
            let merge$$1 = this.splitKey(key);
            let columnIndex = this.getIndexFromAllColumns(merge$$1[0]);
            let vColumnIndices = this.parent.getColumnIndexesInView();
            let span = value - (vColumnIndices[0] - columnIndex);
            if (columnIndex < vColumnIndices[0] && span > 1) {
                for (let row of rows) {
                    if (row.data[merge$$1[0]].toString() === merge$$1[1].toString()) {
                        row.cells[0].cellSpan = span;
                        row.cells[0].spanText = merge$$1[1];
                        break;
                    }
                }
            }
        }
        return rows;
    }
    getIndexFromAllColumns(field) {
        let index = iterateArrayOrObject(this.parent.getVisibleColumns(), (item, index) => {
            if (item.field === field) {
                return index;
            }
            return undefined;
        })[0];
        return index;
    }
}

/**
 * RowRenderer class which responsible for building row content.
 * @hidden
 */
class RowRenderer {
    constructor(serviceLocator, cellType, parent) {
        this.element = createElement('tr', { attrs: { role: 'row' } });
        this.cellType = cellType;
        this.serviceLocator = serviceLocator;
        this.parent = parent;
    }
    /**
     * Function to render the row content based on Column[] and data.
     * @param  {Column[]} columns
     * @param  {Object} data?
     * @param  {{[x:string]:Object}} attributes?
     * @param  {string} rowTemplate?
     */
    render(row, columns, attributes$$1, rowTemplate, cloneNode) {
        return this.refreshRow(row, columns, attributes$$1, rowTemplate, cloneNode);
    }
    /**
     * Function to refresh the row content based on Column[] and data.
     * @param  {Column[]} columns
     * @param  {Object} data?
     * @param  {{[x:string]:Object}} attributes?
     * @param  {string} rowTemplate?
     */
    refresh(row, columns, isChanged, attributes$$1, rowTemplate) {
        if (isChanged) {
            row.data = extend({}, row.changes);
            this.refreshMergeCells(row);
        }
        let node = this.parent.element.querySelector('[data-uid=' + row.uid + ']');
        let tr = this.refreshRow(row, columns, attributes$$1, rowTemplate);
        let cells = [].slice.call(tr.cells);
        node.innerHTML = '';
        for (let cell of cells) {
            node.appendChild(cell);
        }
    }
    refreshRow(row, columns, attributes$$1, rowTemplate, cloneNode) {
        let tr = !isNullOrUndefined(cloneNode) ? cloneNode : this.element.cloneNode();
        let rowArgs = { data: row.data };
        let cellArgs = { data: row.data };
        let attrCopy = extend({}, attributes$$1, {});
        let chekBoxEnable = this.parent.getColumns().filter((col) => col.type === 'checkbox' && col.field)[0];
        let value = false;
        if (chekBoxEnable) {
            value = getValue(chekBoxEnable.field, rowArgs.data);
        }
        if (row.isDataRow) {
            row.isSelected = this.parent.getSelectedRowIndexes().indexOf(row.index) > -1 || value;
        }
        if (row.isDataRow && this.parent.isCheckBoxSelection
            && this.parent.checkAllRows === 'Check' && this.parent.enableVirtualization) {
            row.isSelected = true;
            if (this.parent.getSelectedRowIndexes().indexOf(row.index) === -1) {
                this.parent.getSelectedRowIndexes().push(row.index);
            }
        }
        this.buildAttributeFromRow(tr, row);
        attributes(tr, attrCopy);
        setStyleAndAttributes(tr, row.attributes);
        let cellRendererFact = this.serviceLocator.getService('cellRendererFactory');
        for (let i = 0, len = row.cells.length; i < len; i++) {
            let cell = row.cells[i];
            cell.isSelected = row.isSelected;
            let cellRenderer = cellRendererFact.getCellRenderer(row.cells[i].cellType || CellType.Data);
            let attrs = { 'index': !isNullOrUndefined(row.index) ? row.index.toString() : '' };
            if (row.isExpand && row.cells[i].cellType === CellType.DetailExpand) {
                attrs['class'] = 'e-detailrowexpand';
            }
            let td = cellRenderer.render(row.cells[i], row.data, attrs);
            if (row.cells[i].cellType !== CellType.Filter) {
                if (row.cells[i].cellType === CellType.Data || row.cells[i].cellType === CellType.CommandColumn) {
                    this.parent.trigger(queryCellInfo, extend(cellArgs, {
                        cell: td, column: cell.column, colSpan: 1,
                        foreignKeyData: row.cells[i].foreignKeyData
                    }));
                    if (cellArgs.colSpan > 1 || row.cells[i].cellSpan > 1) {
                        let cellMerge = new CellMergeRender(this.serviceLocator, this.parent);
                        td = cellMerge.render(cellArgs, row, i, td);
                    }
                }
                if (!row.cells[i].isSpanned) {
                    tr.appendChild(td);
                }
            }
        }
        let args = { row: tr, rowHeight: this.parent.rowHeight };
        if (row.isDataRow) {
            this.parent.trigger(rowDataBound, extend(rowArgs, args));
        }
        if (this.parent.enableVirtualization) {
            rowArgs.rowHeight = this.parent.rowHeight;
        }
        if (rowArgs.rowHeight) {
            tr.style.height = rowArgs.rowHeight + 'px';
        }
        else if (this.parent.rowHeight) {
            tr.style.height = this.parent.rowHeight + 'px';
        }
        if (row.cssClass) {
            tr.classList.add(row.cssClass);
        }
        return tr;
    }
    refreshMergeCells(row) {
        for (let cell of row.cells) {
            cell.isSpanned = false;
        }
        return row;
    }
    /**
     * Function to check and add alternative row css class.
     * @param  {Element} tr
     * @param  {{[x:string]:Object}} attr
     */
    buildAttributeFromRow(tr, row) {
        let attr = {};
        let prop = { 'rowindex': 'aria-rowindex', 'dataUID': 'data-uid', 'ariaSelected': 'aria-selected' };
        let classes = [];
        if (row.isDataRow) {
            classes.push('e-row');
        }
        if (row.isAltRow) {
            classes.push('e-altrow');
        }
        if (!isNullOrUndefined(row.index)) {
            attr[prop.rowindex] = row.index;
        }
        if (row.rowSpan) {
            attr.rowSpan = row.rowSpan;
        }
        if (row.uid) {
            attr[prop.dataUID] = row.uid;
        }
        if (row.isSelected) {
            attr[prop.ariaSelected] = true;
        }
        if (row.visible === false) {
            classes.push('e-hide');
        }
        attr.class = classes;
        setStyleAndAttributes(tr, attr);
    }
}

/**
 * RowModelGenerator is used to generate grid data rows.
 * @hidden
 */
class RowModelGenerator {
    /**
     * Constructor for header renderer module
     */
    constructor(parent) {
        this.parent = parent;
    }
    generateRows(data, args) {
        let rows = [];
        let startIndex = this.parent.enableVirtualization ? args.startIndex : 0;
        for (let i = 0, len = Object.keys(data).length; i < len; i++, startIndex++) {
            rows[i] = this.generateRow(data[i], startIndex);
        }
        return rows;
    }
    ensureColumns() {
        //TODO: generate dummy column for group, detail here;
        let cols = [];
        if (this.parent.detailTemplate || this.parent.childGrid) {
            cols.push(this.generateCell({}, null, CellType.DetailExpand));
        }
        return cols;
    }
    generateRow(data, index, cssClass, indent) {
        let options = {};
        options.foreignKeyData = {};
        options.uid = getUid('grid-row');
        options.data = data;
        options.index = index;
        options.indent = indent;
        options.isDataRow = true;
        options.isExpand = false;
        options.cssClass = cssClass;
        options.isAltRow = this.parent.enableAltRow ? index % 2 !== 0 : false;
        options.isSelected = this.parent.getSelectedRowIndexes().indexOf(index) > -1;
        this.refreshForeignKeyRow(options);
        let cells = this.ensureColumns();
        let row = new Row(options);
        row.cells = cells.concat(this.generateCells(options));
        return row;
    }
    refreshForeignKeyRow(options) {
        this.parent.getForeignKeyColumns().forEach((col) => {
            setValue(col.field, getForeignData(col, options.data), options.foreignKeyData);
        });
    }
    generateCells(options) {
        let dummies = this.parent.getColumns();
        let tmp = [];
        dummies.forEach((dummy, index) => tmp.push(this.generateCell(dummy, options.uid, isNullOrUndefined(dummy.commands) ? undefined : CellType.CommandColumn, null, index, options.foreignKeyData)));
        return tmp;
    }
    generateCell(column, rowId, cellType, colSpan, oIndex, foreignKeyData) {
        let opt = {
            'visible': column.visible,
            'isDataCell': !isNullOrUndefined(column.field || column.template),
            'isTemplate': !isNullOrUndefined(column.template),
            'rowID': rowId,
            'column': column,
            'cellType': !isNullOrUndefined(cellType) ? cellType : CellType.Data,
            'colSpan': colSpan,
            'commands': column.commands,
            'isForeignKey': column.isForeignColumn && column.isForeignColumn(),
            'foreignKeyData': column.isForeignColumn && column.isForeignColumn() && getValue(column.field, foreignKeyData)
        };
        if (opt.isDataCell || opt.column.type === 'checkbox') {
            opt.index = this.parent.getColumnIndexByField(column.field);
        }
        return new Cell(opt);
    }
    refreshRows(input) {
        input.forEach((row) => {
            this.refreshForeignKeyRow(row);
            row.cells = this.generateCells(row);
        });
        return input;
    }
}

/**
 * Summary row model generator
 * @hidden
 */
class SummaryModelGenerator {
    /**
     * Constructor for Summary row model generator
     */
    constructor(parent) {
        this.parent = parent;
    }
    getData() {
        let rows = [];
        this.parent.aggregates.slice().forEach((row) => {
            let columns = row.columns.filter((column) => {
                return !(column.footerTemplate || column.groupFooterTemplate || column.groupCaptionTemplate)
                    || this.columnSelector(column);
            });
            if (columns.length) {
                rows.push({ columns: columns });
            }
        });
        return rows;
    }
    columnSelector(column) {
        return column.footerTemplate !== undefined;
    }
    getColumns(start, end) {
        let columns = [];
        if (this.parent.allowGrouping) {
            this.parent.groupSettings.columns.forEach((value) => columns.push(new Column({})));
        }
        if (this.parent.detailTemplate) {
            columns.push(new Column({}));
        }
        columns.push(...this.parent.getColumns());
        return isNullOrUndefined(start) ? columns : columns.slice(start, end);
    }
    generateRows(input, args, start, end) {
        if (this.parent.currentViewData.length === 0) {
            return [];
        }
        let data = this.buildSummaryData(input, args);
        let rows = [];
        this.getData().forEach((row, index) => {
            rows.push(this.getGeneratedRow(row, data[index], args ? args.level : undefined, start, end));
        });
        return rows;
    }
    getGeneratedRow(summaryRow, data, raw, start, end) {
        let tmp = [];
        let indents = this.getIndentByLevel(raw);
        let indentLength = this.parent.groupSettings.columns.length + (this.parent.detailTemplate ? 1 : 0);
        this.getColumns(start, end).forEach((value, index) => tmp.push(this.getGeneratedCell(value, summaryRow, index >= indentLength ? this.getCellType() : CellType.Indent, indents[index])));
        let row = new Row({ data: data, attributes: { class: 'e-summaryrow' } });
        row.cells = tmp;
        row.visible = tmp.some((cell) => cell.isDataCell && cell.visible);
        return row;
    }
    getGeneratedCell(column, summaryRow, cellType, indent) {
        //Get the summary column by display
        let sColumn = summaryRow.columns.filter((scolumn) => scolumn.columnName === column.field)[0];
        let attrs = { 'style': { 'textAlign': column.textAlign } };
        if (indent) {
            attrs.class = indent;
        }
        let opt = {
            'visible': column.visible,
            'isDataCell': !isNullOrUndefined(sColumn),
            'isTemplate': sColumn && !isNullOrUndefined(sColumn.footerTemplate
                || sColumn.groupFooterTemplate || sColumn.groupCaptionTemplate),
            'column': sColumn || {},
            'attributes': attrs,
            'cellType': cellType
        };
        return new Cell(opt);
    }
    buildSummaryData(data, args) {
        let dummy = [];
        let summaryRows = this.getData();
        let single = {};
        summaryRows.forEach((row) => {
            single = {};
            row.columns.forEach((column) => {
                single = this.setTemplate(column, (args && args.aggregates) ? args : data, single);
            });
            dummy.push(single);
        });
        return dummy;
    }
    getIndentByLevel(data) {
        return this.parent.groupSettings.columns.map(() => 'e-indentcelltop');
    }
    setTemplate(column, data, single) {
        let types = column.type;
        let helper = {};
        let formatFn = column.getFormatter() || (() => (a) => a)();
        let group = data;
        if (!(types instanceof Array)) {
            types = [column.type];
        }
        types.forEach((type) => {
            let key = column.field + ' - ' + type.toLowerCase();
            let disp = column.columnName;
            let val = group.aggregates && !isNullOrUndefined(group.aggregates[key]) ? group.aggregates[key] :
                calculateAggregate(type, group.aggregates ? group : data, column, this.parent);
            single[disp] = single[disp] || {};
            single[disp][key] = val;
            single[disp][type] = formatFn(val);
            if (group.field) {
                single[disp].field = group.field;
                single[disp].key = group.key;
            }
        });
        helper.format = column.getFormatter();
        column.setTemplate(helper);
        return single;
    }
    getCellType() {
        return CellType.Summary;
    }
}
class GroupSummaryModelGenerator extends SummaryModelGenerator {
    columnSelector(column) {
        return column.groupFooterTemplate !== undefined;
    }
    getIndentByLevel(level = this.parent.groupSettings.columns.length) {
        return this.parent.groupSettings.columns.map((v, indx) => indx <= level - 1 ? '' : 'e-indentcelltop');
    }
    getCellType() {
        return CellType.GroupSummary;
    }
}
class CaptionSummaryModelGenerator extends SummaryModelGenerator {
    columnSelector(column) {
        return column.groupCaptionTemplate !== undefined;
    }
    getData() {
        let initVal = { columns: [] };
        return [super.getData().reduce((prev, cur) => {
                prev.columns = [...prev.columns, ...cur.columns];
                return prev;
            }, initVal)];
    }
    isEmpty() {
        return (this.getData()[0].columns || []).length === 0;
    }
    getCellType() {
        return CellType.CaptionSummary;
    }
}

/**
 * GroupModelGenerator is used to generate group caption rows and data rows.
 * @hidden
 */
class GroupModelGenerator extends RowModelGenerator {
    constructor(parent) {
        super(parent);
        this.rows = [];
        this.index = 0;
        this.parent = parent;
        this.summaryModelGen = new GroupSummaryModelGenerator(parent);
        this.captionModelGen = new CaptionSummaryModelGenerator(parent);
    }
    generateRows(data, args) {
        if (this.parent.groupSettings.columns.length === 0) {
            return super.generateRows(data, args);
        }
        this.rows = [];
        this.index = this.parent.enableVirtualization ? (this.parent.pageSettings.currentPage - 1) * data.records.length : 0;
        for (let i = 0, len = data.length; i < len; i++) {
            this.getGroupedRecords(0, data[i], data.level);
        }
        this.index = 0;
        return this.rows;
    }
    getGroupedRecords(index, data, raw) {
        let level = raw;
        if (isNullOrUndefined(data.items)) {
            if (isNullOrUndefined(data.GroupGuid)) {
                this.rows = this.rows.concat(this.generateDataRows(data, index));
            }
            else {
                for (let j = 0, len = data.length; j < len; j++) {
                    this.getGroupedRecords(index, data[j], data.level);
                }
            }
        }
        else {
            this.rows = this.rows.concat(this.generateCaptionRow(data, index));
            if (data.items && data.items.length) {
                this.getGroupedRecords(index + 1, data.items, data.items.level);
            }
            if (this.parent.aggregates.length) {
                this.rows.push(...this.summaryModelGen.generateRows(data, { level: level }));
            }
        }
    }
    getCaptionRowCells(field, indent, data) {
        let cells = [];
        let visibles = [];
        let column = this.parent.getColumnByField(field);
        let indexes = this.parent.getColumnIndexesInView();
        if (this.parent.enableColumnVirtualization) {
            column = this.parent.columns.filter((c) => c.field === field)[0];
        }
        let groupedLen = this.parent.groupSettings.columns.length;
        let gObj = this.parent;
        if (!this.parent.enableColumnVirtualization || indexes.indexOf(indent) !== -1) {
            for (let i = 0; i < indent; i++) {
                cells.push(this.generateIndentCell());
            }
            cells.push(this.generateCell({}, null, CellType.Expand));
        }
        indent = this.parent.enableColumnVirtualization ? 1 :
            (this.parent.getVisibleColumns().length + groupedLen + (gObj.detailTemplate || gObj.childGrid ? 1 : 0) -
                indent + (this.parent.getVisibleColumns().length ? -1 : 0));
        //Captionsummary cells will be added here.    
        if (this.parent.aggregates.length && !this.captionModelGen.isEmpty()) {
            let captionCells = this.captionModelGen.generateRows(data)[0];
            extend(data, captionCells.data);
            let cIndex = 0;
            captionCells.cells.some((cell, index) => { cIndex = index; return cell.visible && cell.isDataCell; });
            visibles = captionCells.cells.slice(cIndex).filter((cell) => cell.visible);
            if (captionCells.visible && visibles[0].column.field === this.parent.getVisibleColumns()[0].field) {
                visibles = visibles.slice(1);
            }
            if (this.parent.getVisibleColumns().length === 1) {
                visibles = [];
            }
            indent = indent - visibles.length;
        }
        let cols = (!this.parent.enableColumnVirtualization ? [column] : this.parent.getColumns());
        let wFlag = true;
        cols.forEach((col, index) => {
            let tmpFlag = wFlag && indexes.indexOf(indent) !== -1;
            if (tmpFlag) {
                wFlag = false;
            }
            let cellType = !this.parent.enableColumnVirtualization || tmpFlag ?
                CellType.GroupCaption : CellType.GroupCaptionEmpty;
            indent = this.parent.enableColumnVirtualization && cellType === CellType.GroupCaption ? indent + groupedLen : indent;
            cells.push(this.generateCell(column, null, cellType, indent));
        });
        cells.push(...visibles);
        return cells;
    }
    generateCaptionRow(data, indent) {
        let options = {};
        let col = this.parent.getColumnByField(data.field);
        options.data = extend({}, data);
        if (col) {
            options.data.field = data.field;
        }
        options.isDataRow = false;
        let row = new Row(options);
        row.indent = indent;
        this.getForeignKeyData(row);
        row.cells = this.getCaptionRowCells(data.field, indent, row.data);
        return row;
    }
    getForeignKeyData(row) {
        let data = row.data;
        let col = this.parent.getColumnByField(data.field);
        if (col && col.isForeignColumn && col.isForeignColumn()) {
            setValue('foreignKey', col.valueAccessor(col.foreignKeyValue, getForeignData(col, {}, data.key)[0], col), row.data);
        }
    }
    generateDataRows(data, indent) {
        let rows = [];
        let indexes = this.parent.getColumnIndexesInView();
        for (let i = 0, len = data.length; i < len; i++) {
            rows[i] = this.generateRow(data[i], this.index, i ? undefined : 'e-firstchildrow', indent);
            for (let j = 0; j < indent; j++) {
                if (this.parent.enableColumnVirtualization && indexes.indexOf(indent) === -1) {
                    continue;
                }
                rows[i].cells.unshift(this.generateIndentCell());
            }
            this.index++;
        }
        return rows;
    }
    generateIndentCell() {
        return this.generateCell({}, null, CellType.Indent);
    }
    refreshRows(input) {
        let indexes = this.parent.getColumnIndexesInView();
        input.forEach((row) => {
            if (row.isDataRow) {
                row.cells = this.generateCells(row);
                for (let j = 0; j < row.indent; j++) {
                    if (this.parent.enableColumnVirtualization && indexes.indexOf(row.indent) === -1) {
                        continue;
                    }
                    row.cells.unshift(this.generateIndentCell());
                }
            }
            else {
                let cRow = this.generateCaptionRow(row.data, row.indent);
                row.cells = cRow.cells;
            }
        });
        return input;
    }
}

/**
 * Content module is used to render grid content
 * @hidden
 */
class ContentRender {
    /**
     * Constructor for content renderer module
     */
    constructor(parent, serviceLocator) {
        this.rows = [];
        this.freezeRows = [];
        this.movableRows = [];
        this.isLoaded = true;
        this.drop = (e) => {
            this.parent.notify(columnDrop, { target: e.target, droppedElement: e.droppedElement });
            remove(e.droppedElement);
        };
        this.rafCallback = (args) => {
            let arg = args;
            return () => {
                this.ariaService.setBusy(this.getPanel().firstChild, false);
                if (this.parent.isDestroyed) {
                    return;
                }
                let rows = this.rows.slice(0);
                if (this.parent.getFrozenColumns() !== 0) {
                    rows = args.isFrozen ? this.freezeRows : this.movableRows;
                }
                this.parent.notify(contentReady, { rows: rows, args: arg });
                if (this.isLoaded) {
                    this.parent.trigger(dataBound, {});
                    if (this.parent.allowTextWrap) {
                        this.parent.notify(freezeRender, { case: 'textwrap' });
                    }
                }
                if (arg) {
                    let action = (arg.requestType || '').toLowerCase() + '-complete';
                    this.parent.notify(action, arg);
                }
                this.parent.hideSpinner();
            };
        };
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.ariaService = this.serviceLocator.getService('ariaService');
        this.generator = this.getModelGenerator();
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(columnVisibilityChanged, this.setVisible, this);
        this.parent.on(colGroupRefresh, this.colGroupRefresh, this);
        this.parent.on(uiUpdate, this.enableAfterRender, this);
    }
    /**
     * The function is used to render grid content div
     */
    renderPanel() {
        let gObj = this.parent;
        let div = createElement('div', { className: 'e-gridcontent' });
        let innerDiv = createElement('div', {
            className: 'e-content'
        });
        this.ariaService.setOptions(innerDiv, { busy: false });
        div.appendChild(innerDiv);
        this.setPanel(div);
        gObj.element.appendChild(div);
    }
    /**
     * The function is used to render grid content table
     */
    renderTable() {
        let contentDiv = this.getPanel();
        contentDiv.appendChild(this.createContentTable('_content_table'));
        this.setTable(contentDiv.querySelector('.e-table'));
        this.ariaService.setOptions(this.getTable(), {
            multiselectable: this.parent.selectionSettings.type === 'Multiple'
        });
        this.initializeContentDrop();
        if (this.parent.frozenRows) {
            this.parent.getHeaderContent().classList.add('e-frozenhdrcont');
        }
    }
    /**
     * The function is used to create content table elements
     * @return {Element}
     * @hidden
     */
    createContentTable(id) {
        let innerDiv = this.getPanel().firstChild;
        let table = createElement('table', {
            className: 'e-table', attrs: {
                cellspacing: '0.25px', role: 'grid',
                id: this.parent.element.id + id
            }
        });
        this.setColGroup(this.parent.element.querySelector('.e-gridheader').querySelector('colgroup').cloneNode(true));
        table.appendChild(this.getColGroup());
        table.appendChild(createElement('tbody'));
        innerDiv.appendChild(table);
        return innerDiv;
    }
    splitRows(idx) {
        if (this.parent.getFrozenColumns()) {
            if (idx === 0) {
                this.freezeRows = this.rows;
                this.freezeRowElements = this.rowElements;
            }
            else {
                this.movableRows = this.rows;
            }
        }
    }
    /**
     * Refresh the content of the Grid.
     * @return {void}
     */
    refreshContentRows(args = {}) {
        let gObj = this.parent;
        if (gObj.currentViewData.length === 0) {
            return;
        }
        let dataSource = gObj.currentViewData;
        let frag = document.createDocumentFragment();
        let hdrfrag = document.createDocumentFragment();
        let columns = gObj.getColumns();
        let tr;
        let hdrTbody;
        let frzCols = gObj.getFrozenColumns();
        let row = new RowRenderer(this.serviceLocator, null, this.parent);
        this.rowElements = [];
        this.rows = [];
        let modelData = this.generator.generateRows(dataSource, args);
        let idx = modelData[0].cells[0].index;
        let fCont = this.getPanel().querySelector('.e-frozencontent');
        let mCont = this.getPanel().querySelector('.e-movablecontent');
        let cont = this.getPanel().querySelector('.e-content');
        if (this.parent.enableColumnVirtualization) {
            let cellMerge = new CellMergeRender(this.serviceLocator, this.parent);
            cellMerge.updateVirtualCells(modelData);
        }
        if (frzCols && idx >= frzCols) {
            this.tbody = mCont.querySelector('tbody');
        }
        else {
            this.tbody = this.getTable().querySelector('tbody');
        }
        for (let i = 0, len = modelData.length; i < len; i++) {
            if (!gObj.rowTemplate) {
                tr = row.render(modelData[i], columns);
            }
            else {
                let elements = gObj.getRowTemplate()(extend({ index: i }, dataSource[i]), gObj, 'rowTemplate');
                for (let j = 0; j < elements.length; j++) {
                    let isTR = elements[j].nodeName.toLowerCase() === 'tr';
                    if (isTR || (elements[j].querySelectorAll && elements[j].querySelectorAll('tr').length)) {
                        tr = isTR ? elements[j] : elements[j].querySelector('tr');
                    }
                }
            }
            if (gObj.frozenRows && i < gObj.frozenRows) {
                hdrfrag.appendChild(tr);
            }
            else {
                frag.appendChild(tr);
            }
            this.rows.push(modelData[i]);
            if (modelData[i].isDataRow) {
                //detailrowvisible 
                let td = tr.querySelectorAll('.e-rowcell:not(.e-hide)')[0];
                if (td) {
                    td.classList.add('e-detailrowvisible');
                }
                this.rowElements.push(tr);
            }
            this.ariaService.setOptions(this.getTable(), { colcount: gObj.getColumns().length.toString() });
        }
        this.splitRows(idx);
        if (gObj.frozenRows) {
            hdrTbody = frzCols ? gObj.getHeaderContent().querySelector(idx === 0 ? '.e-frozenheader'
                : '.e-movableheader').querySelector('tbody') : gObj.getHeaderTable().querySelector('tbody');
            hdrTbody.innerHTML = '';
            hdrTbody.appendChild(hdrfrag);
        }
        if (gObj.frozenRows && idx === 0 && cont.offsetHeight === Number(gObj.height)) {
            cont.style.height = (cont.offsetHeight - hdrTbody.offsetHeight) + 'px';
        }
        if (frzCols && idx === 0) {
            this.getPanel().firstChild.style.overflowY = 'hidden';
        }
        args.rows = this.rows.slice(0);
        args.isFrozen = this.parent.getFrozenColumns() !== 0 && !args.isFrozen;
        getUpdateUsingRaf(() => {
            remove(this.tbody);
            this.tbody = createElement('tbody');
            if (frzCols) {
                this.tbody.appendChild(frag);
                if (idx === 0) {
                    this.isLoaded = false;
                    fCont.querySelector('table').appendChild(this.tbody);
                }
                else {
                    if (this.tbody.childElementCount < 1) {
                        this.tbody.appendChild(createElement('tr').appendChild(createElement('td')));
                    }
                    this.isLoaded = true;
                    mCont.querySelector('table').appendChild(this.tbody);
                    fCont.style.height = ((mCont.offsetHeight) - getScrollBarWidth()) + 'px';
                    mCont.style.overflowY = this.parent.height !== 'auto' ? 'scroll' : 'auto';
                    fCont.style.borderRightWidth = '1px';
                }
            }
            else {
                this.appendContent(this.tbody, frag, args);
            }
            if (frzCols && idx === 0) {
                this.refreshContentRows(extend({}, args));
            }
        }, this.rafCallback(extend({}, args)));
    }
    appendContent(tbody, frag, args) {
        tbody.appendChild(frag);
        this.getTable().appendChild(tbody);
    }
    /**
     * Get the content div element of grid
     * @return {Element}
     */
    getPanel() {
        return this.contentPanel;
    }
    /**
     * Set the content div element of grid
     * @param  {Element} panel
     */
    setPanel(panel) {
        this.contentPanel = panel;
    }
    /**
     * Get the content table element of grid
     * @return {Element}
     */
    getTable() {
        return this.contentTable;
    }
    /**
     * Set the content table element of grid
     * @param  {Element} table
     */
    setTable(table) {
        this.contentTable = table;
    }
    /**
     * Get the Row collection in the Grid.
     * @returns {Row[] | HTMLCollectionOf<HTMLTableRowElement>}
     */
    getRows() {
        return this.parent.getFrozenColumns() ? this.freezeRows : this.rows;
    }
    /**
     * Get the Movable Row collection in the Freeze pane Grid.
     * @returns {Row[] | HTMLCollectionOf<HTMLTableRowElement>}
     */
    getMovableRows() {
        return this.movableRows;
    }
    /**
     * Get the content table data row elements
     * @return {Element}
     */
    getRowElements() {
        return this.parent.getFrozenColumns() ? this.freezeRowElements : this.rowElements;
    }
    /**
     * Get the Freeze pane movable content table data row elements
     * @return {Element}
     */
    getMovableRowElements() {
        return this.rowElements;
    }
    /**
     * Get the content table data row elements
     * @return {Element}
     */
    setRowElements(elements) {
        this.rowElements = elements;
    }
    /**
     * Get the header colgroup element
     * @returns {Element}
     */
    getColGroup() {
        return this.colgroup;
    }
    /**
     * Set the header colgroup element
     * @param {Element} colgroup
     * @returns {Element}
     */
    setColGroup(colGroup) {
        return this.colgroup = colGroup;
    }
    /**
     * Function to hide content table column based on visible property
     * @param  {Column[]} columns?
     */
    setVisible(columns) {
        let gObj = this.parent;
        let frzCols = gObj.getFrozenColumns();
        let rows = [];
        if (frzCols) {
            let fRows = this.freezeRows;
            let mRows = this.movableRows;
            let rowLen = fRows.length;
            let cellLen;
            for (let i = 0, row; i < rowLen; i++) {
                cellLen = mRows[i].cells.length;
                row = fRows[i].clone();
                for (let j = 0; j < cellLen; j++) {
                    row.cells.push(mRows[i].cells[j]);
                }
                rows.push(row);
            }
        }
        else {
            rows = this.getRows();
        }
        let testRow;
        rows.some((r) => { if (r.isDataRow) {
            testRow = r;
        } return r.isDataRow; });
        for (let c = 0, clen = columns.length; c < clen; c++) {
            let column = columns[c];
            let idx = this.parent.getNormalizedColumnIndex(column.uid);
            //used canSkip method to skip unwanted visible toggle operation. 
            if (this.canSkip(column, testRow, idx)) {
                continue;
            }
            let displayVal = column.visible === true ? '' : 'none';
            if (frzCols) {
                if (idx < frzCols) {
                    setStyleAttribute(this.getColGroup().childNodes[idx], { 'display': displayVal });
                }
                else {
                    let mTable = gObj.getContent().querySelector('.e-movablecontent').querySelector('colgroup');
                    setStyleAttribute(mTable.childNodes[idx - frzCols], { 'display': displayVal });
                }
            }
            else {
                setStyleAttribute(this.getColGroup().childNodes[idx], { 'display': displayVal });
            }
        }
        this.refreshContentRows({ requestType: 'refresh' });
    }
    colGroupRefresh() {
        if (this.getColGroup()) {
            let colGroup = this.parent.element.querySelector('.e-gridheader').querySelector('colgroup').cloneNode(true);
            this.getTable().replaceChild(colGroup, this.getColGroup());
            this.setColGroup(colGroup);
        }
    }
    initializeContentDrop() {
        let gObj = this.parent;
        let drop = new Droppable(gObj.getContent(), {
            accept: '.e-dragclone',
            drop: this.drop
        });
    }
    canSkip(column, row, index) {
        /**
         * Skip the toggle visiblity operation when one of the following success
         * 1. Grid has empty records
         * 2. column visible property is unchanged
         * 3. cell`s isVisible property is same as column`s visible property.
         */
        return isNullOrUndefined(row) || //(1)
            isNullOrUndefined(column.visible) || //(2)    
            row.cells[index].visible === column.visible; //(3)
    }
    getModelGenerator() {
        return this.generator = this.parent.allowGrouping ? new GroupModelGenerator(this.parent) : new RowModelGenerator(this.parent);
    }
    renderEmpty(tbody) {
        this.getTable().appendChild(tbody);
        if (this.parent.frozenRows) {
            this.parent.getHeaderContent().querySelector('tbody').innerHTML = '';
        }
    }
    setSelection(uid, set, clearAll) {
        if (this.parent.getFrozenColumns()) {
            this.getMovableRows().filter((row) => clearAll || uid === row.uid).forEach((row) => row.isSelected = set);
        }
        this.getRows().filter((row) => clearAll || uid === row.uid)
            .forEach((row) => {
            row.isSelected = set;
            row.cells.forEach((cell) => cell.isSelected = set);
        });
    }
    getRowByIndex(index) {
        return this.parent.getDataRows()[index];
    }
    getVirtualRowIndex(index) {
        return index;
    }
    getMovableRowByIndex(index) {
        return this.parent.getMovableDataRows()[index];
    }
    enableAfterRender(e) {
        if (e.module === 'group' && e.enable) {
            this.generator = this.getModelGenerator();
        }
    }
}

/**
 * Content module is used to render grid content
 * @hidden
 */
class HeaderRender {
    /**
     * Constructor for header renderer module
     */
    constructor(parent, serviceLocator) {
        this.frzIdx = 0;
        this.helper = (e) => {
            let gObj = this.parent;
            let target = e.sender.target;
            let parentEle = parentsUntil(target, 'e-headercell');
            if (!(gObj.allowReordering || gObj.allowGrouping) || (!isNullOrUndefined(parentEle)
                && parentEle.querySelectorAll('.e-checkselectall').length > 0)) {
                return false;
            }
            let visualElement = createElement('div', { className: 'e-cloneproperties e-dragclone e-headerclone' });
            let element = target.classList.contains('e-headercell') ? target : parentEle;
            if (!element || (!gObj.allowReordering && element.classList.contains('e-stackedheadercell'))) {
                return false;
            }
            let height = element.offsetHeight;
            let headercelldiv = element.querySelector('.e-headercelldiv');
            let col;
            if (headercelldiv) {
                col = gObj.getColumnByUid(headercelldiv.getAttribute('e-mappinguid'));
                this.column = col;
                visualElement.setAttribute('e-mappinguid', this.column.uid);
            }
            if (col && !isNullOrUndefined(col.headerTemplate)) {
                if (col.headerTemplate.indexOf('#') !== -1) {
                    visualElement.innerHTML = document.querySelector(col.headerTemplate).innerHTML.trim();
                }
                else {
                    visualElement.innerHTML = col.headerTemplate;
                }
            }
            else {
                visualElement.textContent = headercelldiv ?
                    col.headerText : element.firstElementChild.innerHTML;
            }
            visualElement.style.width = element.offsetWidth + 'px';
            visualElement.style.height = element.offsetHeight + 'px';
            visualElement.style.lineHeight = (height - 6).toString() + 'px';
            gObj.element.appendChild(visualElement);
            return visualElement;
        };
        this.dragStart = (e) => {
            let gObj = this.parent;
            gObj.element.querySelector('.e-gridpopup').style.display = 'none';
            gObj.notify(columnDragStart, { target: e.target, column: this.column, event: e.event });
        };
        this.drag = (e) => {
            let gObj = this.parent;
            let target = e.target;
            if (target) {
                let closest$$1 = closest(target, '.e-grid');
                let cloneElement = this.parent.element.querySelector('.e-cloneproperties');
                if (!closest$$1 || closest$$1.getAttribute('id') !== gObj.element.getAttribute('id')) {
                    classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
                    if (gObj.allowReordering) {
                        gObj.element.querySelector('.e-reorderuparrow').style.display = 'none';
                        gObj.element.querySelector('.e-reorderdownarrow').style.display = 'none';
                    }
                    return;
                }
                gObj.notify(columnDrag, { target: e.target, column: this.column, event: e.event });
            }
        };
        this.dragStop = (e) => {
            let gObj = this.parent;
            let cancel;
            gObj.element.querySelector('.e-gridpopup').style.display = 'none';
            if ((!parentsUntil(e.target, 'e-headercell') && !parentsUntil(e.target, 'e-groupdroparea')) ||
                (!gObj.allowReordering && parentsUntil(e.target, 'e-headercell')) ||
                (!e.helper.getAttribute('e-mappinguid') && parentsUntil(e.target, 'e-groupdroparea'))) {
                remove(e.helper);
                cancel = true;
            }
            gObj.notify(columnDragStop, { target: e.target, event: e.event, column: this.column, cancel: cancel });
        };
        this.drop = (e) => {
            let gObj = this.parent;
            let uid = e.droppedElement.getAttribute('e-mappinguid');
            let closest$$1 = closest(e.target, '.e-grid');
            remove(e.droppedElement);
            if (closest$$1 && closest$$1.getAttribute('id') !== gObj.element.getAttribute('id') ||
                !(gObj.allowReordering || gObj.allowGrouping)) {
                return;
            }
            gObj.notify(headerDrop, { target: e.target, uid: uid });
        };
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.ariaService = this.serviceLocator.getService('ariaService');
        this.widthService = this.serviceLocator.getService('widthService');
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(columnVisibilityChanged, this.setVisible, this);
        this.parent.on(columnPositionChanged, this.colPosRefresh, this);
    }
    /**
     * The function is used to render grid header div
     */
    renderPanel() {
        let div = createElement('div', { className: 'e-gridheader' });
        let innerDiv = createElement('div', { className: 'e-headercontent' });
        div.appendChild(innerDiv);
        this.setPanel(div);
        this.parent.element.appendChild(div);
    }
    /**
     * The function is used to render grid header table
     */
    renderTable() {
        let headerDiv = this.getPanel();
        headerDiv.appendChild(this.createHeaderTable());
        this.setTable(headerDiv.querySelector('.e-table'));
        if (!this.parent.getFrozenColumns()) {
            this.initializeHeaderDrag();
            this.initializeHeaderDrop();
        }
        this.parent.notify(headerRefreshed, { rows: this.rows, args: { isFrozen: this.parent.getFrozenColumns() !== 0 } });
    }
    /**
     * Get the header content div element of grid
     * @return {Element}
     */
    getPanel() {
        return this.headerPanel;
    }
    /**
     * Set the header content div element of grid
     * @param  {Element} panel
     */
    setPanel(panel) {
        this.headerPanel = panel;
    }
    /**
     * Get the header table element of grid
     * @return {Element}
     */
    getTable() {
        return this.headerTable;
    }
    /**
     * Set the header table element of grid
     * @param  {Element} table
     */
    setTable(table) {
        this.headerTable = table;
    }
    /**
     * Get the header colgroup element
     * @returns {Element}
     */
    getColGroup() {
        return this.colgroup;
    }
    /**
     * Set the header colgroup element
     * @param {Element} colgroup
     * @returns {Element}
     */
    setColGroup(colGroup) {
        return this.colgroup = colGroup;
    }
    /**
     * Get the header row element collection.
     * @return {Element[]}
     */
    getRows() {
        let table = this.getTable();
        return table.tHead.rows;
    }
    /**
     * The function is used to create header table elements
     * @return {Element}
     * @hidden
     */
    createHeaderTable() {
        let table = this.createTable();
        let innerDiv = this.getPanel().firstChild;
        innerDiv.appendChild(table);
        return innerDiv;
    }
    /**
     * @hidden
     */
    createTable() {
        let gObj = this.parent;
        let columns = gObj.getColumns();
        let table = createElement('table', { className: 'e-table', attrs: { cellspacing: '0.25px', role: 'grid' } });
        let innerDiv = this.getPanel().firstChild;
        let findHeaderRow = this.createHeaderContent();
        let thead = findHeaderRow.thead;
        let tbody = createElement('tbody', { className: this.parent.frozenRows ? '' : 'e-hide' });
        this.caption = createElement('caption', { innerHTML: this.parent.element.id + '_header_table', className: 'e-hide' });
        let colGroup = createElement('colgroup');
        let rowBody = createElement('tr');
        let bodyCell;
        let rows = this.rows = findHeaderRow.rows;
        let rowRenderer = new RowRenderer(this.serviceLocator, CellType.Header);
        for (let i = 0, len = rows.length; i < len; i++) {
            for (let j = 0, len = rows[i].cells.length; j < len; j++) {
                let cell = rows[i].cells[j];
                bodyCell = createElement('td');
                rowBody.appendChild(bodyCell);
            }
        }
        if (gObj.allowFiltering || gObj.allowSorting || gObj.allowGrouping) {
            table.classList.add('e-sortfilter');
        }
        this.updateColGroup(colGroup);
        tbody.appendChild(rowBody);
        table.appendChild(this.setColGroup(colGroup));
        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(this.caption);
        this.ariaService.setOptions(table, { colcount: gObj.getColumns().length.toString() });
        return table;
    }
    createHeaderContent() {
        let gObj = this.parent;
        let columns = gObj.getColumns();
        let thead = createElement('thead');
        let colHeader = createElement('tr', { className: 'e-columnheader' });
        let rowRenderer = new RowRenderer(this.serviceLocator, CellType.Header, gObj);
        rowRenderer.element = colHeader;
        let rows = [];
        let headerRow;
        this.colDepth = this.getObjDepth();
        for (let i = 0, len = this.colDepth; i < len; i++) {
            rows[i] = this.generateRow(i);
            rows[i].cells = [];
        }
        rows = this.ensureColumns(rows);
        rows = this.getHeaderCells(rows);
        for (let i = 0, len = this.colDepth; i < len; i++) {
            headerRow = rowRenderer.render(rows[i], columns);
            if (this.parent.rowHeight) {
                headerRow.style.height = this.parent.rowHeight + 'px';
            }
            thead.appendChild(headerRow);
        }
        let findHeaderRow = {
            thead: thead,
            rows: rows
        };
        return findHeaderRow;
    }
    updateColGroup(colGroup) {
        let cols = this.parent.getColumns();
        let col;
        let indexes = this.parent.getColumnIndexesInView();
        if (this.parent.allowGrouping) {
            for (let i = 0, len = this.parent.groupSettings.columns.length; i < len; i++) {
                if (this.parent.enableColumnVirtualization && indexes.indexOf(i) === -1) {
                    continue;
                }
                col = createElement('col');
                colGroup.appendChild(col);
            }
        }
        if (this.parent.detailTemplate || this.parent.childGrid) {
            col = createElement('col');
            colGroup.appendChild(col);
        }
        for (let i = 0, len = cols.length; i < len; i++) {
            col = createElement('col');
            if (cols[i].visible === false) {
                setStyleAttribute(col, { 'display': 'none' });
            }
            colGroup.appendChild(col);
        }
        return colGroup;
    }
    ensureColumns(rows) {
        //TODO: generate dummy column for group, detail, stacked row here; ensureColumns here
        let gObj = this.parent;
        let indexes = this.parent.getColumnIndexesInView();
        for (let i = 0, len = rows.length; i < len; i++) {
            if (gObj.allowGrouping) {
                for (let c = 0, len = gObj.groupSettings.columns.length; c < len; c++) {
                    if (this.parent.enableColumnVirtualization && indexes.indexOf(c) === -1) {
                        continue;
                    }
                    rows[i].cells.push(this.generateCell({}, CellType.HeaderIndent));
                }
            }
            if (gObj.detailTemplate || gObj.childGrid) {
                rows[i].cells.push(this.generateCell({}, CellType.DetailHeader));
            }
        }
        return rows;
    }
    getHeaderCells(rows) {
        let thead = this.parent.getHeaderTable() && this.parent.getHeaderTable().querySelector('thead');
        let cols = this.parent.enableColumnVirtualization ? this.parent.getColumns() : this.parent.columns;
        this.frzIdx = 0;
        for (let i = 0, len = cols.length; i < len; i++) {
            rows = this.appendCells(cols[i], rows, 0, i === 0, false, i === (len - 1), thead);
        }
        return rows;
    }
    appendCells(cols, rows, index, isFirstObj, isFirstCol, isLastCol, isMovable) {
        let lastCol = isLastCol ? 'e-lastcell' : '';
        let frzCols = this.parent.getFrozenColumns();
        if (!cols.columns) {
            if (!frzCols || (frzCols
                && ((!isMovable && (this.frzIdx < this.parent.frozenColumns || cols.isFrozen))
                    || (isMovable && this.frzIdx >= this.parent.frozenColumns && !cols.isFrozen)))) {
                rows[index].cells.push(this.generateCell(cols, CellType.Header, this.colDepth - index, (isFirstObj ? '' : (isFirstCol ? 'e-firstcell' : '')) + lastCol, index, this.parent.getColumnIndexByUid(cols.uid)));
            }
            this.frzIdx++;
        }
        else {
            let colSpan = this.getCellCnt(cols, 0);
            if (colSpan) {
                let frzObj = this.refreshFrozenHdr(cols.columns, { isPartial: false, isComp: true, cnt: 0 });
                if (!frzCols || (frzCols
                    && ((!isMovable && (this.parent.frozenColumns - this.frzIdx > 0 || (frzObj.isPartial)))
                        || (isMovable && (colSpan + this.frzIdx > this.parent.frozenColumns && !frzObj.isComp))))) {
                    rows[index].cells.push(new Cell({
                        cellType: CellType.StackedHeader, column: cols,
                        colSpan: this.getColSpan(colSpan, isMovable, frzObj.cnt)
                    }));
                }
            }
            for (let i = 0, len = cols.columns.length; i < len; i++) {
                rows = this.appendCells(cols.columns[i], rows, index + 1, isFirstObj, i === 0, i === (len - 1) && isLastCol, isMovable);
            }
        }
        return rows;
    }
    refreshFrozenHdr(cols, frzObj) {
        for (let i = 0; i < cols.length; i++) {
            if (cols[i].columns) {
                frzObj = this.refreshFrozenHdr(cols[i].columns, frzObj);
            }
            else {
                if (cols[i].isFrozen) {
                    frzObj.isPartial = true;
                    frzObj.cnt++;
                }
                frzObj.isComp = frzObj.isComp && (cols[i].isFrozen ||
                    this.parent.getColumnIndexByField(cols[i].field) < this.parent.frozenColumns);
            }
        }
        return frzObj;
    }
    getColSpan(colSpan, isMovable, frozenCnt) {
        let frzCol = this.parent.frozenColumns;
        if (this.parent.getFrozenColumns() && this.frzIdx + colSpan > frzCol) {
            if (isMovable) {
                colSpan = colSpan - (frzCol > this.frzIdx ? frzCol - this.frzIdx : 0) - frozenCnt;
            }
            else {
                colSpan = colSpan - (colSpan - (frzCol > this.frzIdx ? frzCol + frozenCnt - this.frzIdx : frozenCnt));
            }
        }
        return colSpan;
    }
    generateRow(index) {
        return new Row({});
    }
    generateCell(column, cellType, rowSpan, className, rowIndex, colIndex) {
        let opt = {
            'visible': column.visible,
            'isDataCell': false,
            'isTemplate': !isNullOrUndefined(column.headerTemplate),
            'rowID': '',
            'column': column,
            'cellType': cellType,
            'rowSpan': rowSpan,
            'className': className,
            'index': rowIndex,
            'colIndex': colIndex
        };
        if (!opt.rowSpan || opt.rowSpan < 2) {
            delete opt.rowSpan;
        }
        return new Cell(opt);
    }
    /**
     * Function to hide header table column based on visible property
     * @param  {Column[]} columns?
     */
    setVisible(columns) {
        let gObj = this.parent;
        let rows = [].slice.call(this.getRows()); //NodeList -> Array        
        let displayVal = '';
        let idx;
        let frzCols = gObj.getFrozenColumns();
        for (let c = 0, clen = columns.length; c < clen; c++) {
            let column = columns[c];
            idx = gObj.getNormalizedColumnIndex(column.uid);
            if (column.visible === false) {
                displayVal = 'none';
            }
            if (frzCols) {
                if (idx < frzCols) {
                    setStyleAttribute(this.getColGroup().children[idx], { 'display': displayVal });
                }
                else {
                    let mTblColGrp = gObj.getHeaderContent().querySelector('.e-movableheader').querySelector('colgroup');
                    setStyleAttribute(mTblColGrp.children[idx - frzCols], { 'display': displayVal });
                }
            }
            else {
                setStyleAttribute(this.getColGroup().children[idx], { 'display': displayVal });
            }
            this.refreshUI();
        }
    }
    colPosRefresh() {
        this.refreshUI();
    }
    /**
     * Refresh the header of the Grid.
     * @returns {void}
     */
    refreshUI() {
        let headerDiv = this.getPanel();
        let table = this.getTable();
        let frzCols = this.parent.getFrozenColumns();
        remove(this.getTable());
        table.removeChild(table.firstChild);
        table.removeChild(table.childNodes[0]);
        let colGroup = createElement('colgroup');
        let findHeaderRow = this.createHeaderContent();
        this.rows = findHeaderRow.rows;
        table.insertBefore(findHeaderRow.thead, table.firstChild);
        this.updateColGroup(colGroup);
        table.insertBefore(this.setColGroup(colGroup), table.firstChild);
        this.setTable(table);
        this.appendContent(table);
        this.parent.notify(colGroupRefresh, {});
        this.widthService.setWidthToColumns();
        if (!frzCols) {
            this.initializeHeaderDrag();
        }
        let rows = [].slice.call(headerDiv.querySelectorAll('tr.e-columnheader'));
        for (let row of rows) {
            let gCells = [].slice.call(row.querySelectorAll('.e-grouptopleftcell'));
            if (gCells.length) {
                gCells[gCells.length - 1].classList.add('e-lastgrouptopleftcell');
            }
        }
        if (!frzCols) {
            this.parent.notify(headerRefreshed, { rows: this.rows, args: { isFrozen: this.parent.getFrozenColumns() !== 0 } });
        }
        if (this.parent.allowTextWrap && this.parent.textWrapSettings.wrapMode === 'Header') {
            wrap(rows, true);
        }
    }
    appendContent(table) {
        this.getPanel().firstChild.appendChild(table);
    }
    getObjDepth() {
        let max = 0;
        let cols = this.parent.columns;
        for (let i = 0, len = cols.length; i < len; i++) {
            let depth = this.checkDepth(cols[i], 0);
            if (max < depth) {
                max = depth;
            }
        }
        return max + 1;
    }
    checkDepth(col, index) {
        if (col.columns) {
            index++;
            for (let i = 0, len = col.columns.length; i < len; i++) {
                index = this.checkDepth(col.columns[i], index);
            }
        }
        return index;
    }
    getCellCnt(col, cnt) {
        if (col.columns) {
            for (let i = 0, len = col.columns.length; i < len; i++) {
                cnt = this.getCellCnt(col.columns[i], cnt);
            }
        }
        else {
            if (col.visible) {
                cnt++;
            }
        }
        return cnt;
    }
    initializeHeaderDrag() {
        let gObj = this.parent;
        if (!(this.parent.allowReordering || (this.parent.allowGrouping && this.parent.groupSettings.showDropArea))) {
            return;
        }
        let headerRows = [].slice.call(gObj.getHeaderContent().querySelectorAll('.e-columnheader'));
        for (let i = 0, len = headerRows.length; i < len; i++) {
            let drag = new Draggable(headerRows[i], {
                dragTarget: '.e-headercell',
                distance: 5,
                helper: this.helper,
                dragStart: this.dragStart,
                drag: this.drag,
                dragStop: this.dragStop,
                abort: '.e-rhandler'
            });
        }
    }
    initializeHeaderDrop() {
        let gObj = this.parent;
        let drop = new Droppable(gObj.getHeaderContent(), {
            accept: '.e-dragclone',
            drop: this.drop
        });
    }
}

/**
 * CellRenderer class which responsible for building cell content.
 * @hidden
 */
class CellRenderer {
    constructor(parent, locator) {
        this.element = createElement('TD', { className: 'e-rowcell', attrs: { role: 'gridcell', tabindex: '-1' } });
        this.rowChkBox = createElement('input', { className: 'e-checkselect', attrs: { 'type': 'checkbox' } });
        this.localizer = locator.getService('localization');
        this.formatter = locator.getService('valueFormatter');
        this.parent = parent;
    }
    /**
     * Function to return the wrapper for the TD content
     * @returns string
     */
    getGui() {
        return '';
    }
    /**
     * Function to format the cell value.
     * @param  {Column} column
     * @param  {Object} value
     * @param  {Object} data
     */
    format(column, value, data) {
        if (!isNullOrUndefined(column.format)) {
            value = this.formatter.toView(value, column.getFormatter());
        }
        return isNullOrUndefined(value) ? '' : value.toString();
    }
    evaluate(node, cell, data, attributes$$1, fData) {
        let result;
        if (cell.column.template) {
            let literals = ['index'];
            let dummyData = extend({}, data, { [foreignKeyData]: fData });
            result = cell.column.getColumnTemplate()(extend({ 'index': attributes$$1[literals[0]] }, dummyData), this.parent, 'template');
            appendChildren(node, result);
            node.setAttribute('aria-label', node.innerText + ' is template cell' + ' column header ' +
                cell.column.headerText);
            return false;
        }
        return true;
    }
    /**
     * Function to invoke the custom formatter available in the column object.
     * @param  {Column} column
     * @param  {Object} value
     * @param  {Object} data
     */
    invokeFormatter(column, value, data) {
        if (!isNullOrUndefined(column.formatter)) {
            if (doesImplementInterface(column.formatter, 'getValue')) {
                let formatter = column.formatter;
                value = new formatter().getValue(column, data);
            }
            else if (typeof column.formatter === 'function') {
                value = column.formatter(column, data);
            }
            else {
                value = column.formatter.getValue(column, data);
            }
        }
        return value;
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data
     * @param  {{[x:string]:Object}} attributes?
     * @param  {Element}
     */
    render(cell, data, attributes$$1) {
        return this.refreshCell(cell, data, attributes$$1);
    }
    /**
     * Function to refresh the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data
     * @param  {{[x:string]:Object}} attributes?
     * @param  {Element}
     */
    refreshTD(td, cell, data, attributes$$1) {
        let node = this.refreshCell(cell, data, attributes$$1);
        td.innerHTML = '';
        let elements = [].slice.call(node.childNodes);
        for (let elem of elements) {
            td.appendChild(elem);
        }
    }
    refreshCell(cell, data, attributes$$1) {
        let node = this.element.cloneNode();
        let column = cell.column;
        let fData;
        if (cell.isForeignKey) {
            fData = cell.foreignKeyData[0];
        }
        //Prepare innerHtml
        let innerHtml = this.getGui();
        let value = cell.isForeignKey ? this.getValue(column.foreignKeyValue, fData, column) :
            this.getValue(column.field, data, column);
        if (column.type === 'date' && !isNullOrUndefined(value)) {
            value = new Date(value);
        }
        value = this.format(column, value, data);
        innerHtml = value.toString();
        if (column.type === 'boolean') {
            if (column.displayAsCheckBox) {
                node.classList.add('e-checkbox');
                innerHtml = '<input type="checkbox" disabled ' + '/>';
            }
            else {
                let localeStr = (value !== 'true' && value !== 'false') ? null : value === 'true' ? 'True' : 'False';
                innerHtml = localeStr ? this.localizer.getConstant(localeStr) : innerHtml;
            }
        }
        let fromFormatter = this.invokeFormatter(column, value, data);
        innerHtml = !isNullOrUndefined(column.formatter) ? isNullOrUndefined(fromFormatter) ? '' : fromFormatter.toString() : innerHtml;
        node.setAttribute('aria-label', (innerHtml === '' ? 'empty' : innerHtml) + ' column header ' + cell.column.headerText);
        if (!isNullOrUndefined(cell.column.headerText)) {
            node.setAttribute('aria-label', innerHtml + ' column header ' + cell.column.headerText);
        }
        if (this.evaluate(node, cell, data, attributes$$1, fData) && column.type !== 'checkbox') {
            this.appendHtml(node, innerHtml, column.getDomSetter ? column.getDomSetter() : 'innerHTML');
        }
        else if (column.type === 'checkbox') {
            node.classList.add('e-gridchkbox');
            node.setAttribute('aria-label', 'checkbox');
            if (this.parent.selectionSettings.persistSelection) {
                value = value === 'true';
            }
            else {
                value = false;
            }
            let checkWrap = createCheckBox(false, { checked: value, label: ' ' });
            checkWrap.insertBefore(this.rowChkBox.cloneNode(), checkWrap.firstChild);
            node.appendChild(checkWrap);
        }
        if (this.parent.checkAllRows === 'Check' && this.parent.enableVirtualization) {
            cell.isSelected = true;
        }
        this.setAttributes(node, cell, attributes$$1);
        if (column.type === 'boolean') {
            let obj = new CheckBox({
                disabled: true,
                checked: isNaN(parseInt(value, 10)) ? value === 'true' : parseInt(value, 10) > 0
            });
            obj.appendTo(node.firstElementChild);
            node.setAttribute('aria-label', obj.checked + ' column header ' + cell.column.headerText);
        }
        return node;
    }
    /**
     * Function to specifies how the result content to be placed in the cell.
     * @param  {Element} node
     * @param  {string|Element} innerHtml
     * @returns Element
     */
    appendHtml(node, innerHtml, property = 'innerHTML') {
        node[property] = innerHtml;
        return node;
    }
    /**
     * @hidden
     */
    setAttributes(node, cell, attributes$$1) {
        let column = cell.column;
        this.buildAttributeFromCell(node, cell, column.type === 'checkbox');
        setStyleAndAttributes(node, attributes$$1);
        setStyleAndAttributes(node, cell.attributes);
        if (column.customAttributes) {
            setStyleAndAttributes(node, column.customAttributes);
        }
        if (column.textAlign) {
            node.style.textAlign = column.textAlign;
        }
        if (column.clipMode === 'Clip') {
            node.classList.add('e-gridclip');
        }
        else if (column.clipMode === 'EllipsisWithTooltip') {
            node.classList.add('e-ellipsistooltip');
        }
    }
    buildAttributeFromCell(node, cell, isCheckBoxType) {
        let attr = {};
        let prop = { 'colindex': 'aria-colindex' };
        let classes = [];
        if (cell.colSpan) {
            attr.colSpan = cell.colSpan;
        }
        if (cell.rowSpan) {
            attr.rowSpan = cell.rowSpan;
        }
        if (cell.isTemplate) {
            classes.push('e-templatecell');
        }
        if (cell.isSelected) {
            classes.push(...['e-selectionbackground', 'e-active']);
            if (isCheckBoxType) {
                node.querySelector('.e-frame').classList.add('e-check');
            }
        }
        if (!isNullOrUndefined(cell.index)) {
            attr[prop.colindex] = cell.index;
        }
        if (!cell.visible) {
            classes.push('e-hide');
        }
        attr.class = classes;
        setStyleAndAttributes(node, attr);
    }
    getValue(field, data, column) {
        return column.valueAccessor(field, data, column);
    }
}

/**
 * AriaService
 * @hidden
 */
class AriaService {
    setOptions(target, options) {
        let props = Object.keys(options);
        props.forEach((name) => setStateAndProperties(target, config[name], options[name]));
    }
    setExpand(target, expand) {
        setStateAndProperties(target, config.expand, expand);
    }
    setSort(target, direction) {
        setStateAndProperties(target, config.sort, direction, typeof direction === 'boolean');
    }
    setBusy(target, isBusy) {
        setStateAndProperties(target, config.busy, isBusy);
        setStateAndProperties(target, config.invalid, null, true);
    }
    setGrabbed(target, isGrabbed, remove$$1) {
        setStateAndProperties(target, config.grabbed, isGrabbed, remove$$1);
    }
    setDropTarget(target, isTarget) {
        setStateAndProperties(target, config.dropeffect, 'copy', !isTarget);
    }
}
/**
 * @hidden
 */
function setStateAndProperties(target, attribute, value, remove$$1) {
    if (remove$$1) {
        target.removeAttribute(attribute);
        return;
    }
    if (target) {
        target.setAttribute(attribute, value);
    }
}
const config = {
    expand: 'aria-expanded',
    role: 'role',
    selected: 'aria-selected',
    multiselectable: 'aria-multiselectable',
    sort: 'aria-sort',
    busy: 'aria-busy',
    invalid: 'aria-invalid',
    grabbed: 'aria-grabbed',
    dropeffect: 'aria-dropeffect',
    haspopup: 'aria-haspopup',
    level: 'aria-level',
    colcount: 'aria-colcount'
};

/**
 * HeaderCellRenderer class which responsible for building header cell content.
 * @hidden
 */
class HeaderCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TH', { className: 'e-headercell', attrs: { role: 'columnheader', tabindex: '-1' } });
        this.ariaService = new AriaService();
        this.hTxtEle = createElement('span', { className: 'e-headertext' });
        this.sortEle = createElement('div', { className: 'e-sortfilterdiv e-icons' });
        this.gui = createElement('div');
        this.chkAllBox = createElement('input', { className: 'e-checkselectall', attrs: { 'type': 'checkbox' } });
    }
    /**
     * Function to return the wrapper for the TH content.
     * @returns string
     */
    getGui() {
        return this.gui.cloneNode();
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data
     * @param  {Element}
     */
    render(cell, data, attributes$$1) {
        let node = this.element.cloneNode();
        let fltrMenuEle = createElement('div', { className: 'e-filtermenudiv e-icons e-icon-filter' });
        return this.prepareHeader(cell, node, fltrMenuEle);
    }
    /**
     * Function to refresh the cell content based on Column object.
     * @param  {Cell} cell
     * @param  {Element} node
     */
    refresh(cell, node) {
        this.clean(node);
        let fltrMenuEle = createElement('div', { className: 'e-filtermenudiv e-icons e-icon-filter' });
        return this.prepareHeader(cell, node, fltrMenuEle);
    }
    clean(node) {
        node.innerHTML = '';
    }
    prepareHeader(cell, node, fltrMenuEle) {
        let column = cell.column;
        let ariaAttr = {};
        //Prepare innerHtml
        let innerDIV = this.getGui();
        attributes(innerDIV, {
            'e-mappinguid': column.uid,
            'class': 'e-headercelldiv'
        });
        if (column.type !== 'checkbox') {
            let value = column.headerText;
            let headerText = this.hTxtEle.cloneNode();
            //TODO: Header Template support.
            headerText[column.getDomSetter()] = value;
            innerDIV.appendChild(headerText);
        }
        else {
            column.editType = 'booleanedit';
            let checkAllWrap = createCheckBox(false, { checked: false, label: ' ' });
            checkAllWrap.insertBefore(this.chkAllBox.cloneNode(), checkAllWrap.firstChild);
            innerDIV.appendChild(checkAllWrap);
            innerDIV.classList.add('e-headerchkcelldiv');
        }
        this.buildAttributeFromCell(node, cell);
        this.appendHtml(node, innerDIV);
        node.appendChild(this.sortEle.cloneNode());
        if ((this.parent.allowFiltering && this.parent.filterSettings.type !== 'FilterBar') &&
            (column.allowFiltering && !isNullOrUndefined(column.field)) &&
            !(this.parent.showColumnMenu && column.showColumnMenu)) {
            attributes(fltrMenuEle, {
                'e-mappinguid': 'e-flmenu-' + column.uid,
            });
            node.classList.add('e-fltr-icon');
            let matchFlColumns = [];
            if (this.parent.filterSettings.columns.length && this.parent.filterSettings.columns.length !== matchFlColumns.length) {
                for (let index = 0; index < this.parent.columns.length; index++) {
                    for (let count = 0; count < this.parent.filterSettings.columns.length; count++) {
                        if (this.parent.filterSettings.columns[count].field === column.field) {
                            fltrMenuEle.classList.add('e-filtered');
                            matchFlColumns.push(column.field);
                            break;
                        }
                    }
                }
            }
            node.appendChild(fltrMenuEle.cloneNode());
        }
        if (cell.className) {
            node.classList.add(cell.className);
        }
        if (column.customAttributes) {
            setStyleAndAttributes(node, column.customAttributes);
        }
        if (column.allowSorting) {
            ariaAttr.sort = 'none';
        }
        if (column.allowGrouping) {
            ariaAttr.grabbed = false;
        }
        node = this.extendPrepareHeader(column, node);
        if (!isNullOrUndefined(column.headerTemplate)) {
            if (column.headerTemplate.indexOf('#') !== -1) {
                innerDIV.innerHTML = document.querySelector(column.headerTemplate).innerHTML.trim();
            }
            else {
                innerDIV.innerHTML = column.headerTemplate;
            }
        }
        this.ariaService.setOptions(node, ariaAttr);
        if (!isNullOrUndefined(column.headerTextAlign) || !isNullOrUndefined(column.textAlign)) {
            let alignment = column.headerTextAlign || column.textAlign;
            innerDIV.style.textAlign = alignment;
            if (alignment === 'Right' || alignment === 'Left') {
                node.classList.add(alignment === 'Right' ? 'e-rightalign' : 'e-leftalign');
            }
            else if (alignment === 'Center') {
                node.classList.add('e-centeralign');
            }
        }
        if (column.clipMode === 'Clip') {
            node.classList.add('e-gridclip');
        }
        else if (column.clipMode === 'EllipsisWithTooltip') {
            node.classList.add('e-ellipsistooltip');
        }
        node.setAttribute('aria-rowspan', (!isNullOrUndefined(cell.rowSpan) ? cell.rowSpan : 1).toString());
        node.setAttribute('aria-colspan', '1');
        return node;
    }
    extendPrepareHeader(column, node) {
        if (this.parent.showColumnMenu && column.showColumnMenu && !isNullOrUndefined(column.field)) {
            let element = (createElement('div', { className: 'e-icons e-columnmenu' }));
            let matchFilteredColumns = [];
            if (this.parent.filterSettings.columns.length && this.parent.filterSettings.columns.length !== matchFilteredColumns.length) {
                for (let i = 0; i < this.parent.columns.length; i++) {
                    for (let j = 0; j < this.parent.filterSettings.columns.length; j++) {
                        if (this.parent.filterSettings.columns[j].field === column.field) {
                            element.classList.add('e-filtered');
                            matchFilteredColumns.push(column.field);
                            break;
                        }
                    }
                }
            }
            node.classList.add('e-fltr-icon');
            node.appendChild(element);
        }
        if (this.parent.allowResizing) {
            let handler = createElement('div');
            handler.className = column.allowResizing ? 'e-rhandler e-rcursor' : 'e-rsuppress';
            node.appendChild(handler);
        }
        return node;
    }
    /**
     * Function to specifies how the result content to be placed in the cell.
     * @param  {Element} node
     * @param  {string|Element} innerHtml
     * @returns Element
     */
    appendHtml(node, innerHtml) {
        node.appendChild(innerHtml);
        return node;
    }
}

/**
 * StackedHeaderCellRenderer class which responsible for building stacked header cell content.
 * @hidden
 */
class StackedHeaderCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TH', {
            className: 'e-headercell e-stackedheadercell', attrs: {
                role: 'columnheader',
                tabindex: '-1'
            }
        });
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data
     * @param  {Element}
     */
    render(cell, data, attributes$$1) {
        let node = this.element.cloneNode();
        let div = createElement('div', { className: 'e-stackedheadercelldiv' });
        node.appendChild(div);
        div.innerHTML = cell.column.headerText;
        if (cell.column.toolTip) {
            node.setAttribute('title', cell.column.toolTip);
        }
        if (!isNullOrUndefined(cell.column.textAlign)) {
            div.style.textAlign = cell.column.textAlign;
        }
        node.setAttribute('colspan', cell.colSpan.toString());
        node.setAttribute('aria-colspan', cell.colSpan.toString());
        node.setAttribute('aria-rowspan', '1');
        return node;
    }
}

/**
 * IndentCellRenderer class which responsible for building group indent cell.
 * @hidden
 */
class IndentCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TD', { className: 'e-indentcell' });
    }
    /**
     * Function to render the indent cell
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        setStyleAndAttributes(node, cell.attributes);
        return node;
    }
}

/**
 * GroupCaptionCellRenderer class which responsible for building group caption cell.
 * @hidden
 */
class GroupCaptionCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TD', { className: 'e-groupcaption', attrs: { role: 'gridcell', tabindex: '-1' } });
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        let gObj = this.parent;
        let result;
        let fKeyValue;
        if (cell.isForeignKey) {
            fKeyValue = this.format(cell.column, cell.column.valueAccessor('foreignKey', data, cell.column));
        }
        let value = cell.isForeignKey ? fKeyValue : cell.column.enableGroupByFormat ? data.key :
            this.format(cell.column, cell.column.valueAccessor('key', data, cell.column));
        if (!isNullOrUndefined(gObj.groupSettings.captionTemplate)) {
            if (gObj.groupSettings.captionTemplate.indexOf('#') !== -1) {
                result = templateCompiler(document.querySelector(gObj.groupSettings.captionTemplate).innerHTML.trim())(data);
            }
            else {
                result = templateCompiler(gObj.groupSettings.captionTemplate)(data);
            }
            appendChildren(node, result);
        }
        else {
            node.innerHTML = cell.column.headerText + ': ' + value + ' - ' + data.count + ' ' +
                (data.count < 2 ? this.localizer.getConstant('Item') : this.localizer.getConstant('Items'));
        }
        node.setAttribute('colspan', cell.colSpan.toString());
        node.setAttribute('aria-label', node.innerHTML + ' is groupcaption cell');
        node.setAttribute('title', node.innerHTML);
        return node;
    }
}
/**
 * GroupCaptionEmptyCellRenderer class which responsible for building group caption empty cell.
 * @hidden
 */
class GroupCaptionEmptyCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TD', { className: 'e-groupcaption' });
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        node.innerHTML = '&nbsp;';
        node.setAttribute('colspan', cell.colSpan.toString());
        return node;
    }
}

/**
 * ExpandCellRenderer class which responsible for building group expand cell.
 * @hidden
 */
class ExpandCellRenderer extends IndentCellRenderer {
    /**
     * Function to render the expand cell
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        node.className = 'e-recordplusexpand';
        node.setAttribute('ej-mappingname', data.field);
        node.setAttribute('ej-mappingvalue', data.key);
        node.setAttribute('aria-expanded', 'true');
        node.setAttribute('tabindex', '-1');
        node.appendChild(createElement('div', { className: 'e-icons e-gdiagonaldown e-icon-gdownarrow' }));
        return node;
    }
}

/**
 * HeaderIndentCellRenderer class which responsible for building header indent cell.
 * @hidden
 */
class HeaderIndentCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TH', { className: 'e-grouptopleftcell' });
    }
    /**
     * Function to render the indent cell
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        node.appendChild(createElement('div', { className: 'e-headercelldiv e-emptycell', innerHTML: '&nbsp;' }));
        return node;
    }
}

/**
 * DetailHeaderIndentCellRenderer class which responsible for building detail header indent cell.
 * @hidden
 */
class DetailHeaderIndentCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TH', { className: 'e-detailheadercell' });
    }
    /**
     * Function to render the detail indent cell
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let node = this.element.cloneNode();
        node.appendChild(createElement('div', { className: 'e-emptycell' }));
        return node;
    }
}

/**
 * ExpandCellRenderer class which responsible for building group expand cell.
 * @hidden
 */
class DetailExpandCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TD', {
            className: 'e-detailrowcollapse',
            attrs: { 'aria-expanded': 'false', role: 'gridcell', tabindex: '-1' }
        });
    }
    /**
     * Function to render the detail expand cell
     */
    render(cell, data, attributes$$1) {
        let node = this.element.cloneNode();
        if (attributes$$1 && !isNullOrUndefined(attributes$$1['class'])) {
            node.className = '';
            node.className = attributes$$1['class'];
            node.appendChild(createElement('div', { className: 'e-icons e-dtdiagonaldown e-icon-gdownarrow' }));
        }
        else {
            node.appendChild(createElement('div', { className: 'e-icons e-dtdiagonalright e-icon-grightarrow' }));
        }
        return node;
    }
}

/**
 * Content module is used to render grid content
 * @hidden
 */
class Render {
    /**
     * Constructor for render module
     */
    constructor(parent, locator) {
        this.emptyGrid = false;
        this.parent = parent;
        this.locator = locator;
        this.data = new Data(parent, locator);
        this.l10n = locator.getService('localization');
        this.ariaService = this.locator.getService('ariaService');
        this.renderer = this.locator.getService('rendererFactory');
        this.addEventListener();
    }
    /**
     * To initialize grid header, content and footer rendering
     */
    render() {
        let gObj = this.parent;
        this.headerRenderer = this.renderer.getRenderer(RenderType.Header);
        this.contentRenderer = this.renderer.getRenderer(RenderType.Content);
        this.headerRenderer.renderPanel();
        this.contentRenderer.renderPanel();
        if (gObj.getColumns().length) {
            this.headerRenderer.renderTable();
            this.contentRenderer.renderTable();
            this.emptyRow(false);
        }
        this.refreshDataManager();
    }
    /**
     * Refresh the entire Grid.
     * @return {void}
     */
    refresh(e = { requestType: 'refresh' }) {
        this.parent.notify(`${e.requestType}-begin`, e);
        this.parent.trigger(actionBegin, e);
        if (e.cancel) {
            return;
        }
        this.refreshDataManager(e);
    }
    refreshComplete(e) {
        this.parent.trigger(actionComplete, e);
    }
    /**
     * The function is used to refresh the dataManager
     * @return {void}
     */
    refreshDataManager(args = {}) {
        if (args.requestType !== 'virtualscroll') {
            this.parent.showSpinner();
        }
        this.parent.isEdit = false;
        this.emptyGrid = false;
        let dataManager;
        let isFActon = this.isNeedForeignAction();
        this.ariaService.setBusy(this.parent.getContent().firstChild, true);
        if (isFActon) {
            let deffered = new Deferred();
            dataManager = this.getFData(deffered);
        }
        if (!dataManager) {
            dataManager = this.data.getData(args, this.data.generateQuery().requiresCount())
                .catch((e) => { this.parent.trigger(actionFailure, e); return e; });
        }
        else {
            dataManager = dataManager.then((e) => {
                let query = this.data.generateQuery().requiresCount();
                if (this.emptyGrid) {
                    let def = new Deferred();
                    def.resolve({ result: [], count: 0 });
                    return def.promise;
                }
                return this.data.getData(args, query);
            }).catch((e) => { this.parent.trigger(actionFailure, e); return e; });
        }
        if (this.parent.getForeignKeyColumns().length && (!isFActon || this.parent.searchSettings.key.length)) {
            let deffered = new Deferred();
            dataManager = dataManager.then((e) => {
                this.parent.notify(getForeignKeyData, { dataManager: dataManager, result: e, promise: deffered });
                return deffered.promise;
            });
        }
        if (this.parent.groupSettings.disablePageWiseAggregates && this.parent.groupSettings.columns.length) {
            dataManager = dataManager.then((e) => this.validateGroupRecords(e));
        }
        dataManager.then((e) => this.dataManagerSuccess(e, args))
            .catch((e) => this.dataManagerFailure(e));
    }
    getFData(deferred) {
        this.parent.notify(getForeignKeyData, { isComplex: true, promise: deferred });
        return deferred.promise;
    }
    isNeedForeignAction() {
        let gObj = this.parent;
        return !!((gObj.allowFiltering && gObj.filterSettings.columns.length) ||
            (gObj.searchSettings.key.length)) && this.foreignKey(this.parent.getForeignKeyColumns());
    }
    foreignKey(columns) {
        return columns.some((col) => {
            let fbool = false;
            fbool = this.parent.filterSettings.columns.some((value) => {
                return col.foreignKeyValue === value.field;
            });
            return !!(fbool || this.parent.searchSettings.key.length);
        });
    }
    sendBulkRequest(args) {
        let promise = this.data.saveChanges(args.changes, this.parent.getPrimaryKeyFieldNames()[0]);
        if (this.data.dataManager.dataSource.offline) {
            this.refreshDataManager({ requestType: 'batchsave' });
            return;
        }
        else {
            promise.then((e) => this.dmSuccess(e, args))
                .catch((e) => this.dmFailure(e));
        }
    }
    dmSuccess(e, args) {
        this.dataManagerSuccess(e, args);
    }
    dmFailure(e) {
        this.dataManagerFailure(e);
    }
    /**
     * Render empty row to Grid which is used at the time to represent to no records.
     * @return {void}
     * @hidden
     */
    renderEmptyRow() {
        this.emptyRow(true);
    }
    emptyRow(isTrigger) {
        let gObj = this.parent;
        let tbody = this.contentRenderer.getTable().querySelector('tbody');
        let tr;
        remove(tbody);
        tbody = createElement('tbody');
        tr = createElement('tr', { className: 'e-emptyrow' });
        tr.appendChild(createElement('td', {
            innerHTML: this.l10n.getConstant('EmptyRecord'),
            attrs: { colspan: gObj.getColumns().length.toString() }
        }));
        tbody.appendChild(tr);
        this.contentRenderer.renderEmpty(tbody);
        if (isTrigger) {
            this.parent.trigger(dataBound, {});
            this.parent.notify(onEmpty, { rows: [new Row({ isDataRow: true, cells: [new Cell({ isDataCell: true, visible: true })] })] });
        }
    }
    updateColumnType(record) {
        let columns = this.parent.getColumns();
        let value;
        let data = record && record.items ? record.items[0] : record;
        let fmtr = this.locator.getService('valueFormatter');
        for (let i = 0, len = columns.length; i < len; i++) {
            value = columns[i].isForeignColumn() ? getValue(columns[i].foreignKeyValue || '', columns[i].columnData[0]) :
                getValue(columns[i].field || '', data);
            if (!isNullOrUndefined(value)) {
                this.isColTypeDef = true;
                if (!columns[i].type) {
                    columns[i].type = value.getDay ? (value.getHours() > 0 || value.getMinutes() > 0 ||
                        value.getSeconds() > 0 || value.getMilliseconds() > 0 ? 'datetime' : 'date') : typeof (value);
                }
            }
            else {
                columns[i].type = columns[i].type || null;
            }
            let valueFormatter = new ValueFormatter();
            if (columns[i].format && (columns[i].format.skeleton || columns[i].format.format)) {
                columns[i].setFormatter(valueFormatter.getFormatFunction(columns[i].format));
                columns[i].setParser(valueFormatter.getParserFunction(columns[i].format));
            }
            if (typeof (columns[i].format) === 'string') {
                setFormatter(this.locator, columns[i]);
            }
            else if (!columns[i].format && columns[i].type === 'number') {
                columns[i].setParser(fmtr.getParserFunction({ format: 'n2' }));
            }
        }
    }
    dataManagerSuccess(e, args) {
        let gObj = this.parent;
        gObj.trigger(beforeDataBound, e);
        let len = Object.keys(e.result).length;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.notify(tooltipDestroy, {});
        gObj.currentViewData = e.result;
        if (!len && e.count && gObj.allowPaging) {
            gObj.pageSettings.totalRecordsCount = e.count;
            gObj.pageSettings.currentPage = Math.ceil(e.count / gObj.pageSettings.pageSize);
            gObj.dataBind();
            return;
        }
        if (!gObj.getColumns().length && len) {
            this.updatesOnInitialRender(e);
        }
        if (!this.isColTypeDef && gObj.getCurrentViewRecords()) {
            this.updateColumnType(gObj.getCurrentViewRecords()[0]);
        }
        this.parent.notify(dataReady, extend({ count: e.count, result: e.result, aggregates: e.aggregates }, args));
        if (gObj.groupSettings.columns.length || (args && args.requestType === 'ungrouping')) {
            this.headerRenderer.refreshUI();
        }
        if (len) {
            this.contentRenderer.refreshContentRows(args);
        }
        else {
            if (!gObj.getColumns().length) {
                gObj.element.innerHTML = '';
                alert(this.l10n.getConstant('EmptyDataSourceError')); //ToDO: change this alert as dialog
                return;
            }
            this.contentRenderer.setRowElements([]);
            this.renderEmptyRow();
            if (args) {
                let action = (args.requestType || '').toLowerCase() + '-complete';
                this.parent.notify(action, args);
            }
            this.parent.hideSpinner();
        }
        this.parent.notify(toolbarRefresh, {});
    }
    dataManagerFailure(e) {
        this.ariaService.setOptions(this.parent.getContent().firstChild, { busy: false, invalid: true });
        this.parent.trigger(actionFailure, { error: e });
        this.parent.currentViewData = [];
        this.renderEmptyRow();
        this.parent.hideSpinner();
    }
    updatesOnInitialRender(e) {
        this.buildColumns(e.result[0]);
        prepareColumns(this.parent.columns);
        this.headerRenderer.renderTable();
        this.contentRenderer.renderTable();
        this.parent.notify(autoCol, {});
    }
    buildColumns(record) {
        let columns = Object.keys(record);
        let cols = [];
        for (let i = 0, len = columns.length; i < len; i++) {
            cols[i] = { 'field': columns[i] };
            if (this.parent.enableColumnVirtualization) {
                cols[i].width = !isNullOrUndefined(cols[i].width) ? cols[i].width : 200;
            }
        }
        this.parent.columns = cols;
    }
    instantiateRenderer() {
        this.renderer.addRenderer(RenderType.Header, new HeaderRender(this.parent, this.locator));
        this.renderer.addRenderer(RenderType.Content, new ContentRender(this.parent, this.locator));
        let cellrender = this.locator.getService('cellRendererFactory');
        cellrender.addCellRenderer(CellType.Header, new HeaderCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.Data, new CellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.StackedHeader, new StackedHeaderCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.Indent, new IndentCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.GroupCaption, new GroupCaptionCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.GroupCaptionEmpty, new GroupCaptionEmptyCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.Expand, new ExpandCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.HeaderIndent, new HeaderIndentCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.StackedHeader, new StackedHeaderCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.DetailHeader, new DetailHeaderIndentCellRenderer(this.parent, this.locator));
        cellrender.addCellRenderer(CellType.DetailExpand, new DetailExpandCellRenderer(this.parent, this.locator));
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialLoad, this.instantiateRenderer, this);
        this.parent.on(modelChanged, this.refresh, this);
        this.parent.on(refreshComplete, this.refreshComplete, this);
        this.parent.on(bulkSave, this.sendBulkRequest, this);
        this.parent.on(showEmptyGrid, () => { this.emptyGrid = true; }, this);
    }
    /** @hidden */
    validateGroupRecords(e) {
        let index = e.result.length - 1;
        if (index < 0) {
            return Promise.resolve(e);
        }
        let group0 = e.result[0];
        let groupN = e.result[index];
        let predicate = [];
        let addWhere = (input) => {
            [group0, groupN].forEach((group) => predicate.push(new Predicate('field', '==', group.field).and(this.getPredicate('key', 'equal', group.key))));
            input.where(Predicate.or(predicate));
        };
        let query = new Query();
        addWhere(query);
        let curDm = new DataManager(e.result);
        let curFilter = curDm.executeLocal(query);
        let newQuery = this.data.generateQuery(true);
        let rPredicate = [];
        if (this.data.isRemote()) {
            [group0, groupN].forEach((group) => rPredicate.push(this.getPredicate(group.field, 'equal', group.key)));
            newQuery.where(Predicate.or(rPredicate));
        }
        else {
            addWhere(newQuery);
        }
        let deferred = new Deferred();
        this.data.getData({}, newQuery).then((r) => {
            this.updateGroupInfo(curFilter, r.result);
            deferred.resolve(e);
        }).catch((e) => deferred.reject(e));
        return deferred.promise;
    }
    getPredicate(key, operator, value) {
        if (value instanceof Date) {
            return getDatePredicate({ field: key, operator: operator, value: value });
        }
        return new Predicate(key, operator, value);
    }
    updateGroupInfo(current, untouched) {
        let dm = new DataManager(untouched);
        current.forEach((element, index, array) => {
            let uGroup = dm.executeLocal(new Query()
                .where(new Predicate('field', '==', element.field).and(this.getPredicate('key', 'equal', element.key))))[0];
            element.count = uGroup.count;
            let itemGroup = element.items;
            let uGroupItem = uGroup.items;
            if (itemGroup.GroupGuid) {
                element.items = this.updateGroupInfo(element.items, uGroup.items);
            }
            this.parent.aggregates.forEach((row) => row.columns.forEach((column) => {
                let types = column.type instanceof Array ? column.type : [column.type];
                types.forEach((type) => {
                    let key = column.field + ' - ' + type;
                    element.aggregates[key] = calculateAggregate(type, itemGroup.level ? uGroupItem.records : uGroup.items, column);
                });
            }));
        });
        return current;
    }
}

/**
 * CellRendererFactory
 * @hidden
 */
class CellRendererFactory {
    constructor() {
        this.cellRenderMap = {};
    }
    addCellRenderer(name, type) {
        name = typeof name === 'string' ? name : getEnumValue(CellType, name);
        if (isNullOrUndefined(this.cellRenderMap[name])) {
            this.cellRenderMap[name] = type;
        }
    }
    getCellRenderer(name) {
        name = typeof name === 'string' ? name : getEnumValue(CellType, name);
        if (isNullOrUndefined(this.cellRenderMap[name])) {
            throw `The cellRenderer ${name} is not found`;
        }
        else {
            return this.cellRenderMap[name];
        }
    }
}

/**
 * ServiceLocator
 * @hidden
 */
class ServiceLocator {
    constructor() {
        this.services = {};
    }
    register(name, type) {
        if (isNullOrUndefined(this.services[name])) {
            this.services[name] = type;
        }
    }
    getService(name) {
        if (isNullOrUndefined(this.services[name])) {
            throw `The service ${name} is not registered`;
        }
        return this.services[name];
    }
}

/**
 * RendererFactory
 * @hidden
 */
class RendererFactory {
    constructor() {
        this.rendererMap = {};
    }
    addRenderer(name, type) {
        let rName = getEnumValue(RenderType, name);
        if (isNullOrUndefined(this.rendererMap[rName])) {
            this.rendererMap[rName] = type;
        }
    }
    getRenderer(name) {
        let rName = getEnumValue(RenderType, name);
        if (isNullOrUndefined(this.rendererMap[rName])) {
            throw `The renderer ${rName} is not found`;
        }
        else {
            return this.rendererMap[rName];
        }
    }
}

/**
 * ColumnWidthService
 * @hidden
 */
class ColumnWidthService {
    constructor(parent) {
        this.parent = parent;
    }
    setWidthToColumns() {
        let i = 0;
        let indexes = this.parent.getColumnIndexesInView();
        let wFlag = true;
        if (this.parent.allowGrouping) {
            for (let len = this.parent.groupSettings.columns.length; i < len; i++) {
                if (this.parent.enableColumnVirtualization && indexes.indexOf(i) === -1) {
                    wFlag = false;
                    continue;
                }
                this.setColumnWidth(new Column({ width: '30px' }), i);
            }
        }
        if (this.parent.detailTemplate || this.parent.childGrid) {
            this.setColumnWidth(new Column({ width: '30px' }), i);
        }
        this.parent.getColumns().forEach((column, index) => {
            this.setColumnWidth(column, wFlag ? undefined : index);
        });
    }
    setColumnWidth(column, index, module) {
        let columnIndex = isNullOrUndefined(index) ? this.parent.getNormalizedColumnIndex(column.uid) : index;
        let cWidth = this.getWidth(column);
        if (cWidth !== null) {
            this.setWidth(cWidth, columnIndex);
            if ((this.parent.allowResizing && module === 'resize') || (this.parent.getFrozenColumns() && this.parent.allowResizing)) {
                this.setWidthToTable();
            }
            this.parent.notify(columnWidthChanged, { index: columnIndex, width: cWidth, column: column, module: module });
        }
    }
    setWidth(width, index) {
        let header = this.parent.getHeaderTable();
        let content = this.parent.getContentTable();
        let fWidth = formatUnit(width);
        let headerCol;
        let frzCols = this.parent.getFrozenColumns();
        let mHdr = this.parent.getHeaderContent().querySelector('.e-movableheader');
        if (frzCols && index >= frzCols && mHdr && mHdr.querySelector('colgroup')) {
            headerCol = mHdr.querySelector('colgroup').children[index - frzCols];
        }
        else {
            headerCol = header.querySelector('colgroup').children[index];
        }
        if (headerCol) {
            headerCol.style.width = fWidth;
        }
        let contentCol;
        if (frzCols && index >= frzCols) {
            contentCol = this.parent.getContent().querySelector('.e-movablecontent')
                .querySelector('colgroup').children[index - frzCols];
        }
        else {
            contentCol = content.querySelector('colgroup').children[index];
        }
        if (contentCol) {
            contentCol.style.width = fWidth;
        }
        let edit = content.querySelector('.e-table.e-inline-edit');
        if (edit) {
            edit.querySelector('colgroup').children[index].style.width = fWidth;
        }
    }
    getSiblingsHeight(element) {
        let previous = this.getHeightFromDirection(element, 'previous');
        let next = this.getHeightFromDirection(element, 'next');
        return previous + next;
    }
    getHeightFromDirection(element, direction) {
        let sibling = element[direction + 'ElementSibling'];
        let result = 0;
        let classList$$1 = ['e-gridheader', 'e-gridfooter', 'e-groupdroparea', 'e-gridpager', 'e-toolbar'];
        while (sibling) {
            if (classList$$1.some((value) => sibling.classList.contains(value))) {
                result += sibling.offsetHeight;
            }
            sibling = sibling[direction + 'ElementSibling'];
        }
        return result;
    }
    getWidth(column) {
        if (isNullOrUndefined(column.width) && this.parent.allowResizing) {
            column.width = 200;
        }
        if (!column.width) {
            return null;
        }
        let width = parseInt(column.width.toString(), 10);
        if (column.minWidth && width < parseInt(column.minWidth.toString(), 10)) {
            return column.minWidth;
        }
        else if ((column.maxWidth && width > parseInt(column.maxWidth.toString(), 10))) {
            return column.maxWidth;
        }
        else {
            return column.width;
        }
    }
    getTableWidth(columns) {
        let tWidth = 0;
        for (let column of columns) {
            let cWidth = this.getWidth(column);
            if (column.visible !== false && cWidth !== null) {
                tWidth += parseInt(cWidth.toString(), 10);
            }
        }
        return tWidth;
    }
    setWidthToFrozenTable() {
        let columns = this.parent.getColumns();
        columns.splice(this.parent.getFrozenColumns(), columns.length);
        let freezeWidth = formatUnit(this.getTableWidth(columns));
        this.parent.getHeaderTable().style.width = freezeWidth;
        this.parent.getContentTable().style.width = freezeWidth;
    }
    setWidthToMovableTable() {
        let columns = this.parent.getColumns();
        columns.splice(0, this.parent.getFrozenColumns());
        let movableWidth = formatUnit(this.getTableWidth(columns));
        if (this.parent.getHeaderContent().querySelector('.e-movableheader').firstElementChild) {
            this.parent.getHeaderContent().querySelector('.e-movableheader').firstElementChild.style.width
                = movableWidth;
        }
        this.parent.getContent().querySelector('.e-movablecontent').firstElementChild.style.width =
            movableWidth;
    }
    setWidthToTable() {
        let tWidth = formatUnit(this.getTableWidth(this.parent.getColumns()));
        if (this.parent.getFrozenColumns()) {
            this.setWidthToFrozenTable();
            this.setWidthToMovableTable();
        }
        else {
            this.parent.getHeaderTable().style.width = tWidth;
            this.parent.getContentTable().style.width = tWidth;
        }
        let edit = this.parent.element.querySelector('.e-table.e-inline-edit');
        if (edit) {
            edit.style.width = tWidth;
        }
    }
}

/**
 * FocusStrategy class
 * @hidden
 */
class FocusStrategy {
    constructor(parent) {
        this.currentInfo = {};
        this.oneTime = true;
        this.swap = {};
        this.forget = true;
        this.skipFocus = true;
        this.focusByClick = false;
        this.prevIndexes = {};
        this.parent = parent;
        this.addEventListener();
    }
    focusCheck(e) {
        let target = e.target;
        this.focusByClick = true;
        this.skipFocus = target.classList.contains('e-grid');
    }
    onFocus() {
        if (this.parent.isDestroyed || Browser.isDevice || this.parent.enableVirtualization) {
            return;
        }
        this.setActive(this.parent.frozenRows === 0, this.parent.frozenColumns !== 0);
        let current = this.getContent().matrix.get(0, -1, [0, 1], null, this.getContent().validator());
        this.getContent().matrix.select(current[0], current[1]);
        if (this.skipFocus) {
            this.focus();
            this.skipFocus = false;
        }
    }
    passiveFocus(e) {
        if (this.parent.isDestroyed) {
            return;
        }
        if (e.target && e.target.classList.contains('e-detailcell')) {
            this.currentInfo.skipAction = false;
            addClass([this.currentInfo.element], ['e-focused', 'e-focus']);
        }
    }
    onBlur(e) {
        if ((this.parent.isEdit || e && (!e.relatedTarget || closest(e.relatedTarget, '.e-grid')))) {
            return;
        }
        this.removeFocus();
        this.skipFocus = false;
        this.currentInfo.skipAction = false;
        if (this.getContent().getFocusInfo().elementToFocus) {
            this.getContent().getFocusInfo().elementToFocus.tabIndex = 0;
        }
    }
    onClick(e, force) {
        let isContent = !isNullOrUndefined(closest(e.target, '.e-gridcontent'));
        let isHeader = !isNullOrUndefined(closest(e.target, '.e-gridheader'));
        isContent = isContent && isHeader ? !isContent : isContent;
        let isFrozen = !isNullOrUndefined(closest(e.target, '.e-frozencontent')) ||
            !isNullOrUndefined(closest(e.target, '.e-frozenheader'));
        if (!isContent && isNullOrUndefined(closest(e.target, '.e-gridheader')) ||
            e.target.classList.contains('e-content')) {
            return;
        }
        this.setActive(isContent, isFrozen);
        if (!isContent && isNullOrUndefined(closest(e.target, '.e-gridheader')) ||
            e.target.classList.contains('e-filtermenudiv')) {
            this.clearOutline();
            return;
        }
        let beforeArgs = { cancel: false, byKey: false, byClick: !isNullOrUndefined(e.target), clickArgs: e };
        this.parent.notify(beforeCellFocused, beforeArgs);
        if (beforeArgs.cancel || closest(e.target, '.e-inline-edit')) {
            return;
        }
        this.setActive(isContent, isFrozen);
        if (this.getContent()) {
            let returnVal = this.getContent().onClick(e, force);
            if (returnVal === false) {
                return;
            }
            this.focus();
        }
    }
    onKeyPress(e) {
        if (this.skipOn(e)) {
            return;
        }
        let beforeArgs = { cancel: false, byKey: true, byClick: false, keyArgs: e };
        this.parent.notify(beforeCellFocused, beforeArgs);
        if (beforeArgs.cancel) {
            return;
        }
        let bValue = this.getContent().matrix.current;
        this.currentInfo.outline = true;
        let swapInfo = this.getContent().jump(e.action, bValue);
        this.swap = swapInfo;
        if (swapInfo.swap) {
            this.setActive(!swapInfo.toHeader, swapInfo.toFrozen);
            this.getContent().matrix.current = this.getContent().getNextCurrent(bValue, swapInfo, this.active, e.action);
            this.prevIndexes = {};
        }
        this.setActiveByKey(e.action, this.getContent());
        let returnVal = this.getContent().onKeyPress(e);
        if (returnVal === false) {
            this.clearIndicator();
            return;
        }
        e.preventDefault();
        this.focus(e);
    }
    skipOn(e) {
        let target = e.target;
        if (!target) {
            return false;
        }
        if (this.currentInfo.skipAction) {
            this.clearIndicator();
            return true;
        }
        if (['pageUp', 'pageDown'].indexOf(e.action) > -1) {
            this.clearIndicator();
            return true;
        }
        return (e.action === 'delete'
            || (this.parent.editSettings.mode !== 'Batch' && (this.parent.isEdit || ['insert', 'f2'].indexOf(e.action) > -1))
            || (closest(document.activeElement, '.e-filterbarcell') !== null ||
                closest(document.activeElement, '#' + this.parent.element.id + '_searchbar') !== null
                    && ['enter', 'leftArrow', 'rightArrow',
                        'shiftLeft', 'shiftRight', 'ctrlPlusA'].indexOf(e.action) > -1)
            || (closest(target, '.e-gridcontent') === null && closest(target, '.e-gridheader') === null)
            || (e.action === 'space' && (!target.classList.contains('e-gridchkbox') && closest(target, '.e-gridchkbox') === null
                && closest(target, '.e-headerchkcelldiv') === null)));
    }
    getFocusedElement() {
        return this.currentInfo.elementToFocus;
    }
    getContent() {
        return this.active || this.content;
    }
    setActive(content, isFrozen) {
        this.active = content ? isFrozen ? this.fContent : this.content :
            isFrozen ? this.fHeader : this.header;
    }
    setFocusedElement(element) {
        this.currentInfo.elementToFocus = element;
        setTimeout(() => this.currentInfo.elementToFocus.focus(), 0);
    }
    focus(e) {
        this.removeFocus();
        this.addFocus(this.getContent().getFocusInfo(), e);
    }
    removeFocus(e) {
        if (!this.currentInfo.element) {
            return;
        }
        removeClass([this.currentInfo.element, this.currentInfo.elementToFocus], ['e-focused', 'e-focus']);
        this.currentInfo.element.tabIndex = -1;
    }
    addFocus(info, e) {
        this.currentInfo = info;
        this.currentInfo.outline = info.outline && !isNullOrUndefined(e);
        if (!info.element) {
            return;
        }
        let isFocused = info.elementToFocus.classList.contains('e-focus');
        if (isFocused) {
            return;
        }
        if (this.currentInfo.outline) {
            addClass([info.element], ['e-focused']);
        }
        addClass([info.elementToFocus], ['e-focus']);
        info.element.tabIndex = 0;
        if (!isFocused) {
            this.setFocusedElement(info.elementToFocus);
        }
        this.parent.notify(cellFocused, {
            element: info.elementToFocus,
            parent: info.element,
            indexes: this.getContent().matrix.current,
            byKey: !isNullOrUndefined(e),
            byClick: isNullOrUndefined(e),
            keyArgs: e,
            isJump: this.swap.swap,
            container: this.getContent().getInfo(e),
            outline: !isNullOrUndefined(e),
            swapInfo: this.swap
        });
        let [rowIndex, cellIndex] = this.getContent().matrix.current;
        this.prevIndexes = { rowIndex, cellIndex };
        this.focusByClick = false;
    }
    refreshMatrix(content) {
        return (e) => {
            if (content && (e.args && e.args.isFrozen) && !this.fContent) {
                this.fContent = new FixedContentFocus(this.parent);
            }
            else if (content && !this.content) {
                this.content = new ContentFocus(this.parent);
            }
            if (!content && (e.args && e.args.isFrozen) && !this.fHeader) {
                this.fHeader = new FixedHeaderFocus(this.parent);
            }
            else if (!content && !this.header) {
                this.header = new HeaderFocus(this.parent);
            }
            let cFocus = content ? (e.args && e.args.isFrozen) ? this.fContent : this.content :
                (e.args && e.args.isFrozen) ? this.fHeader : this.header;
            let rows = content ? e.rows.slice(this.parent.frozenRows) : e.rows;
            let updateRow = content ? e.rows.slice(0, this.parent.frozenRows) : e.rows;
            let matrix = cFocus.matrix.generate(updateRow, cFocus.selector);
            cFocus.matrix.generate(rows, cFocus.selector);
            cFocus.generateRows(updateRow, { matrix, handlerInstance: (e.args && e.args.isFrozen) ? this.fHeader : this.header });
            if (!Browser.isDevice && !this.focusByClick && e && e.args && e.args.requestType === 'paging') {
                this.skipFocus = false;
                this.parent.element.focus();
            }
        };
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        EventHandler.add(this.parent.element, 'mousedown', this.focusCheck, this);
        EventHandler.add(this.parent.element, 'focus', this.onFocus, this);
        this.parent.element.addEventListener('focus', this.passiveHandler = (e) => this.passiveFocus(e), true);
        EventHandler.add(this.parent.element, 'focusout', this.onBlur, this);
        this.parent.on(keyPressed, this.onKeyPress, this);
        this.parent.on(click, this.onClick, this);
        this.parent.on(contentReady, this.refreshMatrix(true), this);
        this.parent.on(headerRefreshed, this.refreshMatrix(), this);
        this.parent.on('close-edit', this.restoreFocus, this);
        ['start-edit', 'start-add'].forEach((evt) => this.parent.on(evt, this.clearIndicator, this));
        ['sorting'].forEach((action) => this.parent.on(`${action}-complete`, this.restoreFocus, this));
        this.parent.on(batchAdd, this.refreshMatrix(true), this);
        this.parent.on(batchCancel, this.refreshMatrix(true), this);
        this.parent.on(batchDelete, this.refreshMatrix(true), this);
        this.parent.on(detailDataBound, this.refreshMatrix(true), this);
        this.parent.on(onEmpty, this.refreshMatrix(true), this);
        this.parent.on(cellFocused, this.internalCellFocus, this);
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        EventHandler.remove(this.parent.element, 'mousedown', this.focusCheck);
        EventHandler.remove(this.parent.element, 'focus', this.onFocus);
        EventHandler.remove(this.parent.element, 'focusout', this.onBlur);
        this.parent.element.removeEventListener('focus', this.passiveHandler, true);
        this.parent.off(keyPressed, this.onKeyPress);
        this.parent.off(click, this.onClick);
        this.parent.off(contentReady, this.refreshMatrix(true));
        this.parent.off(headerRefreshed, this.refreshMatrix());
        this.parent.off('close-edit', this.restoreFocus);
        ['start-edit', 'start-add'].forEach((evt) => this.parent.off(evt, this.clearOutline));
        ['sorting'].forEach((action) => this.parent.off(`${action}-complete`, this.restoreFocus));
        this.parent.off(batchAdd, this.refreshMatrix(true));
        this.parent.off(batchDelete, this.refreshMatrix(true));
        this.parent.off(batchCancel, this.refreshMatrix(true));
        this.parent.off(detailDataBound, this.refreshMatrix(true));
        this.parent.off(onEmpty, this.refreshMatrix(true));
        this.parent.off(cellFocused, this.internalCellFocus);
    }
    destroy() {
        this.removeEventListener();
    }
    restoreFocus() {
        this.addFocus(this.getContent().getFocusInfo());
    }
    clearOutline() {
        this.getContent().matrix.current = this.getContent().matrix.get(0, -1, [0, 1], 'downArrow', this.getContent().validator());
        this.clearIndicator();
    }
    clearIndicator() {
        if (!this.currentInfo.element || !this.currentInfo.elementToFocus) {
            return;
        }
        removeClass([this.currentInfo.element, this.currentInfo.elementToFocus], ['e-focus', 'e-focused']);
    }
    getPrevIndexes() {
        let forget = this.forget;
        this.forget = false;
        return forget ? { rowIndex: null, cellIndex: null } : this.prevIndexes;
    }
    forgetPrevious() {
        this.forget = true;
    }
    setActiveByKey(action, active) {
        if (this.parent.frozenColumns === 0 && this.parent.frozenRows === 0) {
            return;
        }
        let info;
        let actions = {
            'home': () => ({ toHeader: !info.isContent, toFrozen: true }),
            'end': () => ({ toHeader: !info.isContent, toFrozen: false }),
            'ctrlHome': () => ({ toHeader: true, toFrozen: this.parent.frozenColumns !== 0 }),
            'ctrlEnd': () => ({ toHeader: false, toFrozen: false })
        };
        if (!(action in actions)) {
            return;
        }
        info = active.getInfo();
        let swap = actions[action]();
        this.setActive(!swap.toHeader, swap.toFrozen);
        this.getContent().matrix.current = active.matrix.current;
    }
    internalCellFocus(e) {
        if (!(e.byKey && e.container.isContent && e.keyArgs.action === 'enter'
            && (e.parent.classList.contains('e-detailcell') ||
                e.parent.classList.contains('e-unboundcell') || e.parent.classList.contains('e-templatecell')))) {
            return;
        }
        this.clearIndicator();
        let focusEle = this.getContent().getFocusable(this.getFocusedElement());
        this.setFocusedElement(focusEle);
        this.currentInfo.skipAction = true;
    }
}
/**
 * Create matrix from row collection which act as mental model for cell navigation
 * @hidden
 */
class Matrix {
    constructor() {
        this.matrix = [];
        this.current = [];
    }
    set(rowIndex, columnIndex, allow) {
        rowIndex = Math.max(0, Math.min(rowIndex, this.rows));
        columnIndex = Math.max(0, Math.min(columnIndex, this.columns));
        this.matrix[rowIndex] = this.matrix[rowIndex] || [];
        this.matrix[rowIndex][columnIndex] = allow ? 1 : 0;
    }
    get(rowIndex, columnIndex, navigator, action, validator) {
        let tmp = columnIndex;
        if (rowIndex + navigator[0] < 0) {
            return [rowIndex, columnIndex];
        }
        rowIndex = Math.max(0, Math.min(rowIndex + navigator[0], this.rows));
        columnIndex = Math.max(0, Math.min(columnIndex + navigator[1], this.matrix[rowIndex].length - 1));
        if (tmp + navigator[1] > this.matrix[rowIndex].length - 1 && validator(rowIndex, columnIndex, action)) {
            return [rowIndex, tmp];
        }
        let first = this.first(this.matrix[rowIndex], columnIndex, navigator, true, action);
        columnIndex = first === null ? tmp : first;
        let val = getValue(`${rowIndex}.${columnIndex}`, this.matrix);
        return this.inValid(val) || !validator(rowIndex, columnIndex, action) ?
            this.get(rowIndex, tmp, navigator, action, validator) : [rowIndex, columnIndex];
    }
    first(vector, index, navigator, moveTo, action) {
        if (((index < 0 || index === vector.length) && this.inValid(vector[index])
            && (action !== 'upArrow' && action !== 'downArrow')) || !vector.some((v) => v === 1)) {
            return null;
        }
        return !this.inValid(vector[index]) ? index :
            this.first(vector, (['upArrow', 'downArrow', 'shiftUp', 'shiftDown'].indexOf(action) !== -1) ? moveTo ? 0 : ++index : index + navigator[1], navigator, false, action);
    }
    select(rowIndex, columnIndex) {
        rowIndex = Math.max(0, Math.min(rowIndex, this.rows));
        columnIndex = Math.max(0, Math.min(columnIndex, this.matrix[rowIndex].length - 1));
        this.current = [rowIndex, columnIndex];
    }
    generate(rows, selector) {
        this.rows = rows.length - 1;
        this.matrix = [];
        rows.forEach((row, rIndex) => {
            let cells = row.cells.filter((c) => c.isSpanned !== true);
            this.columns = Math.max(cells.length - 1, this.columns | 0);
            cells.forEach((cell, cIndex) => {
                this.set(rIndex, cIndex, selector(row, cell));
            });
        });
        return this.matrix;
    }
    inValid(value) {
        return value === 0 || value === undefined;
    }
}
/**
 * @hidden
 */
class ContentFocus {
    constructor(parent) {
        this.matrix = new Matrix();
        this.parent = parent;
        this.keyActions = {
            'rightArrow': [0, 1],
            'tab': [0, 1],
            'leftArrow': [0, -1],
            'shiftTab': [0, -1],
            'upArrow': [-1, 0],
            'downArrow': [1, 0],
            'shiftUp': [-1, 0],
            'shiftDown': [1, 0],
            'shiftRight': [0, 1],
            'shiftLeft': [0, -1],
            'enter': [1, 0],
            'shiftEnter': [-1, 0]
        };
        this.indexesByKey = (action) => {
            let opt = {
                'home': [this.matrix.current[0], -1, 0, 1],
                'end': [this.matrix.current[0], this.matrix.columns + 1, 0, -1],
                'ctrlHome': [0, -1, 0, 1],
                'ctrlEnd': [this.matrix.rows, this.matrix.columns + 1, 0, -1]
            };
            return opt[action] || null;
        };
    }
    getTable() {
        return (this.parent.frozenColumns ?
            this.parent.getContent().querySelector('.e-movablecontent .e-table') :
            this.parent.getContentTable());
    }
    onKeyPress(e) {
        let navigator = this.keyActions[e.action];
        let current = this.getCurrentFromAction(e.action, navigator, e.action in this.keyActions, e);
        if (!current) {
            return;
        }
        if ((['tab', 'shiftTab'].indexOf(e.action) > -1 && this.matrix.current || []).toString() === current.toString()) {
            if (current.toString() === [this.matrix.rows, this.matrix.columns].toString() ||
                current.toString() === [0, 0].toString()) {
                return false;
            }
        }
        this.matrix.select(current[0], current[1]);
    }
    getCurrentFromAction(action, navigator = [0, 0], isPresent, e) {
        if (!isPresent && !this.indexesByKey(action)) {
            return null;
        }
        if (!this.shouldFocusChange(e)) {
            return this.matrix.current;
        }
        let [rowIndex, cellIndex, rN, cN] = this.indexesByKey(action) || [...this.matrix.current, ...navigator];
        let current = this.matrix.get(rowIndex, cellIndex, [rN, cN], action, this.validator());
        return current;
    }
    onClick(e, force) {
        let target = e.target;
        target = (target.classList.contains('e-rowcell') ? target : closest(target, 'td'));
        target = target ? target : closest(e.target, 'td.e-detailrowcollapse')
            || closest(e.target, 'td.e-detailrowexpand');
        target = closest(e.target, 'td.e-detailcell') ?
            isNullOrUndefined(closest(closest(e.target, '.e-grid'), 'td.e-detailcell')) ? null : target : target;
        target = target && closest(target, 'table').classList.contains('e-table') ? target : null;
        if (!target) {
            return false;
        }
        let [rowIndex, cellIndex] = [target.parentElement.rowIndex, target.cellIndex];
        let [oRowIndex, oCellIndex] = this.matrix.current;
        let val = getValue(`${rowIndex}.${cellIndex}`, this.matrix.matrix);
        if (this.matrix.inValid(val) || (!force && oRowIndex === rowIndex && oCellIndex === cellIndex)) {
            return false;
        }
        this.matrix.select(rowIndex, cellIndex);
    }
    getFocusInfo() {
        let info = {};
        let [rowIndex = 0, cellIndex = 0] = this.matrix.current;
        this.matrix.current = [rowIndex, cellIndex];
        info.element = this.getTable().rows[rowIndex].cells[cellIndex];
        if (!info.element) {
            return info;
        }
        info.elementToFocus = !info.element.classList.contains('e-unboundcell') && !info.element.classList.contains('e-detailcell')
            && !info.element.classList.contains('e-templatecell') ? this.getFocusable(info.element) : info.element;
        info.outline = true;
        return info;
    }
    getFocusable(element) {
        let query = 'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
        if (this.parent.isEdit) {
            query = 'input:not([type="hidden"]), select:not([aria-hidden="true"]), textarea';
        }
        let child = [].slice.call(element.querySelectorAll(query));
        /* Select the first focusable child element
         * if no child found then select the cell itself.
         * if Grid is in editable state, check for editable control inside child.
         */
        return child.length ? child[0] : element;
    }
    selector(row, cell) {
        let types = [CellType.Expand, CellType.GroupCaption, CellType.CaptionSummary, CellType.GroupSummary];
        return ((row.isDataRow && cell.visible && (cell.isDataCell || cell.isTemplate))
            || (row.isDataRow && cell.cellType === CellType.DetailExpand)
            || (!row.isDataRow && types.indexOf(cell.cellType) > -1)
            || (cell.column && cell.column.type === 'checkbox')
            || (cell.cellType === CellType.CommandColumn))
            && !(row.edit === 'delete' && row.isDirty);
    }
    jump(action, current) {
        let frozenSwap = this.parent.frozenColumns > 0 &&
            ((action === 'leftArrow' || action === 'shiftTab') && current[1] === 0);
        let enterFrozen = this.parent.frozenRows !== 0 && action === 'shiftEnter';
        let info = {
            swap: ((action === 'upArrow' || enterFrozen) && current[0] === 0) || frozenSwap,
            toHeader: (action === 'upArrow' || enterFrozen) && current[0] === 0,
            toFrozen: frozenSwap
        };
        return info;
    }
    getNextCurrent(previous = [], swap, active, action) {
        let current = [];
        if (action === 'rightArrow' || action === 'tab') {
            current[0] = previous[0];
            current[1] = -1;
        }
        else if (action === 'downArrow' || action === 'enter') {
            current[0] = -1;
            current[1] = previous[1];
        }
        return current;
    }
    generateRows(rows, optionals) {
        let { matrix, handlerInstance } = optionals;
        let len = handlerInstance.matrix.matrix.length;
        let defaultLen = this.parent.allowFiltering && this.parent.filterSettings.type === 'FilterBar' ? len + 1 : len;
        handlerInstance.matrix.matrix = handlerInstance.matrix.matrix.slice(0, defaultLen); //Header matrix update.
        handlerInstance.matrix.rows = defaultLen;
        handlerInstance.matrix.matrix.push(...matrix);
        handlerInstance.matrix.rows += matrix.length;
    }
    getInfo(e) {
        let info = this.getFocusInfo();
        let [rIndex, cIndex] = this.matrix.current;
        let isData = info.element.classList.contains('e-rowcell');
        let isSelectable = isData || (e && e.action !== 'enter' && (info.element.classList.contains('e-detailrowcollapse')
            || info.element.classList.contains('e-detailrowexpand')));
        let [rowIndex, cellIndex] = [Math.min(parseInt(info.element.parentElement.getAttribute('aria-rowindex'), 10), rIndex),
            Math.min(parseInt(info.element.getAttribute('aria-colindex'), 10), cIndex)];
        return { isContent: true, isDataCell: isData, indexes: [rowIndex, cellIndex], isSelectable: isSelectable };
    }
    validator() {
        let table = this.getTable();
        return (rowIndex, cellIndex, action) => {
            let cell = table.rows[rowIndex].cells[cellIndex];
            if (action === 'enter' || action === 'shiftEnter') {
                return cell.classList.contains('e-rowcell');
            }
            if ((action === 'shiftUp' || action === 'shiftDown') && cell.classList.contains('e-rowcell')) {
                return true;
            }
            else if (action !== 'shiftUp' && action !== 'shiftDown') {
                return cell.getBoundingClientRect().width !== 0;
            }
            return false;
        };
    }
    shouldFocusChange(e) {
        let [rIndex = -1, cIndex = -1] = this.matrix.current;
        if (rIndex < 0 || cIndex < 0) {
            return true;
        }
        let cell = getValue(`${rIndex}.cells.${cIndex}`, this.getTable().rows);
        if (!cell) {
            return true;
        }
        return e.action === 'enter' || e.action === 'shiftEnter' ?
            cell.classList.contains('e-rowcell') && !cell.classList.contains('e-unboundcell')
                && !cell.classList.contains('e-templatecell') && !cell.classList.contains('e-detailcell') : true;
    }
}
/**
 * @hidden
 */
class HeaderFocus extends ContentFocus {
    constructor(parent) {
        super(parent);
    }
    getTable() {
        return (this.parent.frozenColumns ? this.parent.getHeaderContent().querySelector('.e-movableheader .e-table') :
            this.parent.getHeaderTable());
    }
    onClick(e) {
        let target = e.target;
        target = (target.classList.contains('e-headercell') ? target : closest(target, 'th'));
        if (!target && this.parent.frozenRows !== 0) {
            target = (e.target.classList.contains('e-rowcell') ? e.target :
                closest(e.target, 'td'));
        }
        if (!target) {
            return;
        }
        let [rowIndex, cellIndex] = [target.parentElement.rowIndex, target.cellIndex];
        let val = getValue(`${rowIndex}.${cellIndex}`, this.matrix.matrix);
        if (this.matrix.inValid(val)) {
            return false;
        }
        this.matrix.select(target.parentElement.rowIndex, target.cellIndex);
    }
    getFocusInfo() {
        let info = {};
        let [rowIndex = 0, cellIndex = 0] = this.matrix.current;
        info.element = this.getTable().rows[rowIndex].cells[cellIndex];
        info.elementToFocus = this.getFocusable(info.element);
        info.outline = !info.element.classList.contains('e-filterbarcell');
        return info;
    }
    selector(row, cell) {
        return (cell.visible && (cell.column.field !== undefined || cell.isTemplate)) || cell.column.type === 'checkbox' ||
            cell.cellType === CellType.StackedHeader;
    }
    jump(action, current) {
        let frozenSwap = this.parent.frozenColumns > 0 &&
            (action === 'leftArrow' || action === 'shiftTab') && current[1] === 0;
        let enterFrozen = this.parent.frozenRows !== 0 && action === 'enter';
        return {
            swap: ((action === 'downArrow' || enterFrozen) && current[0] === this.matrix.matrix.length - 1) ||
                frozenSwap,
            toHeader: frozenSwap,
            toFrozen: frozenSwap
        };
    }
    getNextCurrent(previous = [], swap, active, action) {
        let current = [];
        if (action === 'upArrow' || action === 'shiftEnter') {
            current[0] = this.matrix.matrix.length;
            current[1] = previous[1];
        }
        else if (action === 'rightArrow' || action === 'tab') {
            current[0] = previous[0];
            current[1] = -1;
        }
        return current;
    }
    generateRows(rows) {
        let length = this.matrix.matrix.length;
        if (this.parent.allowFiltering && this.parent.filterSettings.type === 'FilterBar') {
            this.matrix.rows = ++this.matrix.rows;
            rows[0].cells.forEach((cell, cIndex) => this.matrix.set(length, cIndex, cell.visible && cell.column.allowFiltering !== false));
        }
    }
    getInfo(e) {
        return extend(super.getInfo(e), { isContent: false, isHeader: true });
    }
    validator() {
        return () => true;
    }
    shouldFocusChange(e) {
        let [rIndex, cIndex] = this.matrix.current;
        if (rIndex < 0 || cIndex < 0) {
            return true;
        }
        let cell = getValue(`${rIndex}.cells.${cIndex}`, this.getTable().rows);
        if (!cell) {
            return true;
        }
        return e.action === 'enter' || e.action === 'altDownArrow' ? !cell.classList.contains('e-headercell') : true;
    }
}
class FixedContentFocus extends ContentFocus {
    getTable() {
        return this.parent.getContent().querySelector('.e-frozencontent .e-table');
    }
    jump(action, current) {
        let enterFrozen = this.parent.frozenRows !== 0 && action === 'shiftEnter';
        return {
            swap: (action === 'upArrow' || enterFrozen) && current[0] === 0
                || ((action === 'tab' || action === 'rightArrow') && current[1] === this.matrix.columns),
            toHeader: (action === 'upArrow' || enterFrozen) && current[0] === 0,
            toFrozen: (action === 'upArrow' || enterFrozen) && current[0] === 0
        };
    }
    getNextCurrent(previous = [], swap, active, action) {
        let current = [];
        if (action === 'leftArrow' || action === 'shiftTab') {
            current[0] = previous[0];
            current[1] = active.matrix.columns + 1;
        }
        else if (action === 'downArrow' || action === 'enter') {
            current[0] = -1;
            current[1] = previous[1];
        }
        return current;
    }
}
class FixedHeaderFocus extends HeaderFocus {
    jump(action, current) {
        let enterFrozen = this.parent.frozenRows !== 0 && action === 'enter';
        return {
            swap: (action === 'downArrow' || enterFrozen) && current[0] === this.matrix.matrix.length - 1
                || ((action === 'rightArrow' || action === 'tab') && current[1] === this.matrix.columns),
            toHeader: (action === 'rightArrow' || action === 'tab') && current[1] === this.matrix.columns,
            toFrozen: (action === 'downArrow' || enterFrozen) && current[0] === this.matrix.matrix.length - 1
        };
    }
    getTable() {
        return (this.parent.getHeaderContent().querySelector('.e-frozenheader .e-table'));
    }
    getNextCurrent(previous = [], swap, active, action) {
        let current = [];
        if (action === 'leftArrow' || action === 'shiftTab') {
            current[0] = previous[0];
            current[1] = active.matrix.columns + 1;
        }
        else if (action === 'upArrow' || action === 'shiftEnter') {
            current[0] = this.matrix.matrix.length;
            current[1] = previous[1];
        }
        return current;
    }
}
/** @hidden */
class SearchBox {
    constructor(searchBox) {
        this.searchBox = searchBox;
    }
    searchFocus(args) {
        args.target.parentElement.classList.add('e-input-focus');
    }
    searchBlur(args) {
        args.target.parentElement.classList.remove('e-input-focus');
    }
    wireEvent() {
        if (this.searchBox) {
            EventHandler.add(this.searchBox, 'focus', this.searchFocus, this);
            EventHandler.add(this.searchBox, 'blur', this.searchBlur, this);
        }
    }
    unWireEvent() {
        if (this.searchBox) {
            EventHandler.remove(this.searchBox, 'focus', this.searchFocus);
            EventHandler.remove(this.searchBox, 'blur', this.searchBlur);
        }
    }
}

var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Configures the paging behavior of the Grid.
 */
class PageSettings extends ChildProperty {
}
__decorate$1([
    Property(12)
], PageSettings.prototype, "pageSize", void 0);
__decorate$1([
    Property(8)
], PageSettings.prototype, "pageCount", void 0);
__decorate$1([
    Property(1)
], PageSettings.prototype, "currentPage", void 0);
__decorate$1([
    Property()
], PageSettings.prototype, "totalRecordsCount", void 0);
__decorate$1([
    Property(false)
], PageSettings.prototype, "enableQueryString", void 0);
__decorate$1([
    Property(false)
], PageSettings.prototype, "pageSizes", void 0);
__decorate$1([
    Property(null)
], PageSettings.prototype, "template", void 0);

/**
 * The `Selection` module is used to handle cell and row selection.
 */
class Selection {
    /**
     * Constructor for the Grid selection module
     * @hidden
     */
    constructor(parent, selectionSettings, locator) {
        //Internal variables       
        /**
         * @hidden
         */
        this.selectedRowIndexes = [];
        /**
         * @hidden
         */
        this.selectedRowCellIndexes = [];
        /**
         * @hidden
         */
        this.selectedRecords = [];
        this.preventFocus = false;
        this.isMultiShiftRequest = false;
        this.isMultiCtrlRequest = false;
        this.enableSelectMultiTouch = false;
        this.selectedRowState = {};
        this.totalRecordsCount = 0;
        this.chkAllCollec = [];
        this.isCheckedOnAdd = false;
        this.persistSelectedData = [];
        this.isCancelDeSelect = false;
        this.isPreventCellSelect = false;
        this.parent = parent;
        this.selectionSettings = selectionSettings;
        this.factory = locator.getService('rendererFactory');
        this.focus = locator.getService('focus');
        this.addEventListener();
    }
    initializeSelection() {
        EventHandler.add(this.parent.getContent(), 'mousedown', this.mouseDownHandler, this);
    }
    /**
     * The function used to trigger onActionBegin
     * @return {void}
     * @hidden
     */
    onActionBegin(args, type) {
        this.parent.trigger(type, this.fDataUpdate(args));
    }
    fDataUpdate(args) {
        if (args.cellIndex || args.rowIndex) {
            let rowObj = this.getRowObj(isNullOrUndefined(args.rowIndex) ? isNullOrUndefined(args.cellIndex) ?
                this.currentIndex : args.cellIndex.rowIndex : args.rowIndex);
            args.foreignKeyData = rowObj.foreignKeyData;
        }
        return args;
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(args, type) {
        this.parent.trigger(type, this.fDataUpdate(args));
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'selection';
    }
    /**
     * To destroy the selection
     * @return {void}
     * @hidden
     */
    destroy() {
        this.hidePopUp();
        this.clearSelection();
        this.removeEventListener();
        EventHandler.remove(this.parent.getContent(), 'mousedown', this.mouseDownHandler);
    }
    isEditing() {
        return (this.parent.editSettings.mode === 'Normal' || (this.parent.editSettings.mode === 'Batch' &&
            this.parent.editModule.formObj && !this.parent.editModule.formObj.validate())) &&
            this.parent.isEdit && !this.parent.isPersistSelection;
    }
    getSelectedMovableRow(index) {
        let gObj = this.parent;
        if (gObj.getFrozenColumns()) {
            return gObj.getMovableRowByIndex(index);
        }
        return null;
    }
    /**
     * Selects a row by the given index.
     * @param  {number} index - Defines the row index.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @return {void}
     */
    selectRow(index, isToggle) {
        let gObj = this.parent;
        let selectedRow = gObj.getRowByIndex(index);
        let selectedMovableRow = this.getSelectedMovableRow(index);
        let selectData = gObj.getCurrentViewRecords()[index];
        if (!this.isRowType() || !selectedRow || this.isEditing()) {
            // if (this.isEditing()) {
            //     gObj.selectedRowIndex = index;
            // }
            return;
        }
        let isRowSelected = selectedRow.hasAttribute('aria-selected');
        isToggle = !isToggle ? isToggle : index === this.prevRowIndex && isRowSelected;
        let args;
        let can = 'cancel';
        if (!isToggle) {
            args = {
                data: selectData, rowIndex: index, isCtrlPressed: this.isMultiCtrlRequest,
                isShiftPressed: this.isMultiShiftRequest, row: selectedRow,
                previousRow: gObj.getRows()[this.prevRowIndex], previousRowIndex: this.prevRowIndex, target: this.target
            };
            args = this.addMovableArgs(args, selectedMovableRow);
            this.onActionBegin(args, rowSelecting);
        }
        if (!isNullOrUndefined(args) && args[can] === true) {
            return;
        }
        this.clearRow();
        if (!isToggle) {
            this.updateRowSelection(selectedRow, index);
            if (gObj.getFrozenColumns()) {
                this.updateRowSelection(selectedMovableRow, index);
            }
            gObj.selectedRowIndex = index;
        }
        this.updateRowProps(index);
        if (!isToggle) {
            args = {
                data: selectData, rowIndex: index,
                row: selectedRow, previousRow: gObj.getRows()[this.prevRowIndex],
                previousRowIndex: this.prevRowIndex, target: this.target
            };
            args = this.addMovableArgs(args, selectedMovableRow);
            this.onActionComplete(args, rowSelected);
        }
    }
    addMovableArgs(targetObj, mRow) {
        if (this.parent.getFrozenColumns()) {
            let mObj = { mRow: mRow, previousMovRow: this.parent.getMovableRows()[this.prevRowIndex] };
            targetObj = Object.assign({}, targetObj, mObj);
        }
        return targetObj;
    }
    /**
     * Selects a range of rows from start and end row indexes.
     * @param  {number} startIndex - Specifies the start row index.
     * @param  {number} endIndex - Specifies the end row index.
     * @return {void}
     */
    selectRowsByRange(startIndex, endIndex) {
        this.selectRows(this.getCollectionFromIndexes(startIndex, endIndex));
        this.parent.selectedRowIndex = endIndex;
    }
    /**
     * Selects a collection of rows by index.
     * @param  {number[]} rowIndexes - Specifies an array of row indexes.
     * @return {void}
     */
    selectRows(rowIndexes) {
        let gObj = this.parent;
        let rowIndex = !this.isSingleSel() ? rowIndexes[0] : rowIndexes[rowIndexes.length - 1];
        let selectedRow = gObj.getRowByIndex(rowIndex);
        let selectedMovableRow = this.getSelectedMovableRow(rowIndex);
        let frzCols = gObj.getFrozenColumns();
        let selectedData = gObj.getCurrentViewRecords()[rowIndexes[0]];
        if (!this.isRowType() || this.isEditing()) {
            return;
        }
        let args = {
            rowIndexes: rowIndexes, row: selectedRow, rowIndex: rowIndex, target: this.target,
            prevRow: gObj.getRows()[this.prevRowIndex], previousRowIndex: this.prevRowIndex,
            isCtrlPressed: this.isMultiCtrlRequest, isShiftPressed: this.isMultiShiftRequest,
            data: selectedData
        };
        args = this.addMovableArgs(args, selectedMovableRow);
        this.onActionBegin(args, rowSelecting);
        this.clearRow();
        if (!this.isSingleSel()) {
            for (let rowIdx of rowIndexes) {
                this.updateRowSelection(gObj.getRowByIndex(rowIdx), rowIdx);
                if (frzCols) {
                    this.updateRowSelection(gObj.getMovableRowByIndex(rowIdx), rowIdx);
                }
                this.updateRowProps(rowIndex);
            }
        }
        else {
            this.updateRowSelection(gObj.getRowByIndex(rowIndex), rowIndex);
            if (frzCols) {
                this.updateRowSelection(gObj.getMovableRowByIndex(rowIndex), rowIndex);
            }
            this.updateRowProps(rowIndex);
        }
        args = {
            rowIndexes: rowIndexes, row: selectedRow, rowIndex: rowIndex, target: this.target,
            prevRow: gObj.getRows()[this.prevRowIndex], previousRowIndex: this.prevRowIndex,
            data: selectedData
        };
        args = this.addMovableArgs(args, selectedMovableRow);
        this.onActionComplete(args, rowSelected);
    }
    /**
     * Select rows with existing row selection by passing row indexes.
     * @param  {number} startIndex - Specifies the row indexes.
     * @return {void}
     * @hidden
     */
    addRowsToSelection(rowIndexes) {
        let gObj = this.parent;
        let selectedRow = !this.isSingleSel() ? gObj.getRowByIndex(rowIndexes[0]) :
            gObj.getRowByIndex(rowIndexes[rowIndexes.length - 1]);
        let selectedMovableRow = !this.isSingleSel() ? this.getSelectedMovableRow(rowIndexes[0]) :
            this.getSelectedMovableRow(rowIndexes[rowIndexes.length - 1]);
        let frzCols = gObj.getFrozenColumns();
        if (!this.isRowType() || this.isEditing()) {
            return;
        }
        let args;
        for (let rowIndex of rowIndexes) {
            let rowObj = this.getRowObj(rowIndex);
            let isUnSelected = this.selectedRowIndexes.indexOf(rowIndex) > -1;
            gObj.selectedRowIndex = rowIndex;
            if (isUnSelected) {
                this.rowDeselect(rowDeselecting, [rowIndex], [rowObj.data], [selectedRow], [rowObj.foreignKeyData]);
                this.selectedRowIndexes.splice(this.selectedRowIndexes.indexOf(rowIndex), 1);
                this.selectedRecords.splice(this.selectedRecords.indexOf(selectedRow), 1);
                selectedRow.removeAttribute('aria-selected');
                this.addRemoveClassesForRow(selectedRow, false, null, 'e-selectionbackground', 'e-active');
                if (selectedMovableRow) {
                    this.selectedRecords.splice(this.selectedRecords.indexOf(selectedMovableRow), 1);
                    selectedMovableRow.removeAttribute('aria-selected');
                    this.addRemoveClassesForRow(selectedMovableRow, false, null, 'e-selectionbackground', 'e-active');
                }
                this.rowDeselect(rowDeselected, [rowIndex], [rowObj.data], [selectedRow], [rowObj.foreignKeyData], [selectedMovableRow]);
            }
            else {
                args = {
                    data: rowObj.data, rowIndex: rowIndex, row: selectedRow, target: this.target,
                    prevRow: gObj.getRows()[this.prevRowIndex], previousRowIndex: this.prevRowIndex,
                    isCtrlPressed: this.isMultiCtrlRequest, isShiftPressed: this.isMultiShiftRequest,
                    foreignKeyData: rowObj.foreignKeyData
                };
                args = this.addMovableArgs(args, selectedMovableRow);
                this.onActionBegin(args, rowSelecting);
                if (this.isSingleSel()) {
                    this.clearRow();
                }
                this.updateRowSelection(selectedRow, rowIndex);
                if (frzCols) {
                    this.updateRowSelection(selectedMovableRow, rowIndex);
                }
            }
            this.updateRowProps(rowIndex);
            if (!isUnSelected) {
                args = {
                    data: rowObj.data, rowIndex: rowIndex, row: selectedRow, target: this.target,
                    prevRow: gObj.getRows()[this.prevRowIndex], previousRowIndex: this.prevRowIndex,
                    foreignKeyData: rowObj.foreignKeyData
                };
                args = this.addMovableArgs(args, selectedMovableRow);
                this.onActionComplete(args, rowSelected);
            }
            if (this.isSingleSel()) {
                break;
            }
        }
    }
    getCollectionFromIndexes(startIndex, endIndex) {
        let indexes = [];
        let { i, max } = (startIndex < endIndex) ?
            { i: startIndex, max: endIndex } : { i: endIndex, max: startIndex };
        for (; i <= max; i++) {
            indexes.push(i);
        }
        if (startIndex > endIndex) {
            indexes.reverse();
        }
        return indexes;
    }
    clearRow() {
        this.clearRowSelection();
        this.selectedRowIndexes = [];
        this.selectedRecords = [];
        this.parent.selectedRowIndex = -1;
        if (this.isSingleSel() && this.parent.isPersistSelection) {
            this.selectedRowState = {};
        }
    }
    updateRowProps(startIndex) {
        this.prevRowIndex = startIndex;
        this.isRowSelected = this.selectedRowIndexes.length && true;
    }
    updatePersistCollection(selectedRow, chkState) {
        if (this.parent.isPersistSelection && !isNullOrUndefined(selectedRow)) {
            let rowObj = this.getRowObj(selectedRow);
            let pKey = rowObj.data ? rowObj.data[this.primaryKey] : null;
            if (pKey === null) {
                return;
            }
            rowObj.isSelected = chkState;
            if (chkState) {
                this.selectedRowState[pKey] = chkState;
                if (this.persistSelectedData.indexOf(rowObj.data) < 0) {
                    this.persistSelectedData.push(rowObj.data);
                }
            }
            else {
                delete (this.selectedRowState[pKey]);
                if (this.persistSelectedData.indexOf(rowObj.data) >= 0) {
                    this.persistSelectedData.splice(this.persistSelectedData.indexOf(rowObj.data), 1);
                }
            }
        }
    }
    updateCheckBoxes(row, chkState) {
        if (!isNullOrUndefined(row)) {
            let chkBox = row.querySelector('.e-checkselect');
            if (!isNullOrUndefined(chkBox)) {
                removeAddCboxClasses(chkBox.nextElementSibling, chkState);
                if (isNullOrUndefined(this.checkedTarget) || (!isNullOrUndefined(this.checkedTarget)
                    && !this.checkedTarget.classList.contains('e-checkselectall'))) {
                    this.setCheckAllState();
                }
            }
        }
    }
    updateRowSelection(selectedRow, startIndex) {
        if (!selectedRow) {
            return;
        }
        this.selectedRowIndexes.push(startIndex);
        let len = this.selectedRowIndexes.length;
        if (this.parent.getFrozenColumns() && len > 1) {
            if ((this.selectedRowIndexes[len - 2] === this.selectedRowIndexes[len - 1])) {
                this.selectedRowIndexes.pop();
            }
        }
        this.selectedRecords.push(selectedRow);
        selectedRow.setAttribute('aria-selected', 'true');
        this.updatePersistCollection(selectedRow, true);
        this.updateCheckBoxes(selectedRow, true);
        this.addRemoveClassesForRow(selectedRow, true, null, 'e-selectionbackground', 'e-active');
        if (!this.preventFocus) {
            let target = this.focus.getPrevIndexes().cellIndex ?
                selectedRow.cells[this.focus.getPrevIndexes().cellIndex] :
                selectedRow.querySelector('.e-selectionbackground:not(.e-hide)');
            if (!target) {
                return;
            }
            this.focus.onClick({ target }, true);
        }
    }
    /**
     * Deselects the currently selected rows and cells.
     * @return {void}
     */
    clearSelection() {
        if (!this.parent.isPersistSelection || (this.parent.isPersistSelection && !this.parent.isEdit) ||
            (!isNullOrUndefined(this.checkedTarget) && this.checkedTarget.classList.contains('e-checkselectall'))) {
            let span = this.parent.element.querySelector('.e-gridpopup').querySelector('span');
            if (span.classList.contains('e-rowselect')) {
                span.classList.remove('e-spanclicked');
            }
            this.clearRowSelection();
            this.clearCellSelection();
            this.enableSelectMultiTouch = false;
        }
    }
    /**
     * Deselects the currently selected rows.
     * @return {void}
     */
    clearRowSelection() {
        if (this.isRowSelected) {
            let gObj = this.parent;
            let rows = this.parent.getDataRows();
            let data = [];
            let row = [];
            let mRow = [];
            let rowIndex = [];
            let frzCols = gObj.getFrozenColumns();
            let foreignKeyData$$1 = [];
            let currentViewData = this.parent.getCurrentViewRecords();
            for (let i = 0, len = this.selectedRowIndexes.length; i < len; i++) {
                let currentRow = this.parent.getDataRows()[this.selectedRowIndexes[i]];
                let rowObj = this.getRowObj(currentRow);
                if (rowObj) {
                    data.push(rowObj.data);
                    row.push(currentRow);
                    rowIndex.push(this.selectedRowIndexes[i]);
                    foreignKeyData$$1.push(rowObj.foreignKeyData);
                }
                if (frzCols) {
                    mRow.push(gObj.getMovableRows()[this.selectedRowIndexes[i]]);
                }
            }
            this.rowDeselect(rowDeselecting, rowIndex, data, row, foreignKeyData$$1, mRow);
            if (this.isCancelDeSelect === true) {
                return;
            }
            rows.filter((record) => record.hasAttribute('aria-selected')).forEach((ele) => {
                ele.removeAttribute('aria-selected');
                this.addRemoveClassesForRow(ele, false, true, 'e-selectionbackground', 'e-active');
                this.updatePersistCollection(ele, false);
                this.updateCheckBoxes(ele);
            });
            for (let i = 0, len = this.selectedRowIndexes.length; i < len; i++) {
                let movableRow = this.getSelectedMovableRow(this.selectedRowIndexes[i]);
                if (movableRow) {
                    movableRow.removeAttribute('aria-selected');
                    this.addRemoveClassesForRow(movableRow, false, true, 'e-selectionbackground', 'e-active');
                    this.updatePersistCollection(movableRow, false);
                }
            }
            this.selectedRowIndexes = [];
            this.selectedRecords = [];
            this.isRowSelected = false;
            this.parent.selectedRowIndex = -1;
            this.rowDeselect(rowDeselected, rowIndex, data, row, foreignKeyData$$1, mRow);
        }
    }
    rowDeselect(type, rowIndex, data, row, foreignKeyData$$1, mRow) {
        let cancl = 'cancel';
        this.updatePersistCollection(row[0], false);
        let rowDeselectObj = { rowIndex: rowIndex, data: data, row: row, foreignKeyData: foreignKeyData$$1 };
        this.parent.trigger(type, this.parent.getFrozenColumns() ? Object.assign({}, rowDeselectObj, { mRow: mRow }) : rowDeselectObj);
        this.isCancelDeSelect = rowDeselectObj[cancl];
        this.updateCheckBoxes(row[0]);
    }
    getRowObj(row = this.currentIndex) {
        if (isNullOrUndefined(row)) {
            return {};
        }
        if (typeof row === 'number') {
            row = this.parent.getRowByIndex(row);
        }
        if (row) {
            return this.parent.getRowObjectFromUID(row.getAttribute('data-uid')) || {};
        }
        return {};
    }
    getSelectedMovableCell(cellIndex) {
        let gObj = this.parent;
        let frzCols = gObj.getFrozenColumns();
        if (frzCols) {
            if (cellIndex.cellIndex >= frzCols) {
                return gObj.getMovableCellFromIndex(cellIndex.rowIndex, this.getColIndex(cellIndex.rowIndex, cellIndex.cellIndex));
            }
            return null;
        }
        return null;
    }
    /**
     * Selects a cell by the given index.
     * @param  {IIndex} cellIndex - Defines the row and column indexes.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @return {void}
     */
    selectCell(cellIndex, isToggle) {
        if (!this.isCellType()) {
            return;
        }
        let gObj = this.parent;
        let selectedCell = this.getSelectedMovableCell(cellIndex);
        if (!selectedCell) {
            selectedCell = gObj.getCellFromIndex(cellIndex.rowIndex, this.getColIndex(cellIndex.rowIndex, cellIndex.cellIndex));
        }
        this.currentIndex = cellIndex.rowIndex;
        let args;
        let cncl = 'cancel';
        let selectedData = gObj.getCurrentViewRecords()[this.currentIndex];
        if (!this.isCellType() || !selectedCell || this.isEditing()) {
            return;
        }
        let isCellSelected = selectedCell.classList.contains('e-cellselectionbackground');
        isToggle = !isToggle ? isToggle : (!isUndefined(this.prevCIdxs) &&
            cellIndex.rowIndex === this.prevCIdxs.rowIndex && cellIndex.cellIndex === this.prevCIdxs.cellIndex &&
            isCellSelected);
        if (!isToggle) {
            args = {
                data: selectedData, cellIndex: cellIndex, currentCell: selectedCell,
                isCtrlPressed: this.isMultiCtrlRequest, isShiftPressed: this.isMultiShiftRequest, previousRowCellIndex: this.prevECIdxs,
                previousRowCell: this.prevECIdxs ?
                    this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined,
                cancel: false
            };
            this.onActionBegin(args, cellSelecting);
        }
        if (!isNullOrUndefined(args) && args[cncl] === true) {
            return;
        }
        this.clearCell();
        if (!isToggle) {
            this.updateCellSelection(selectedCell, cellIndex.rowIndex, cellIndex.cellIndex);
        }
        this.updateCellProps(cellIndex, cellIndex);
        if (!isToggle) {
            this.onActionComplete({
                data: selectedData, cellIndex: cellIndex, currentCell: selectedCell,
                previousRowCellIndex: this.prevECIdxs, selectedRowCellIndex: this.selectedRowCellIndexes,
                previousRowCell: this.prevECIdxs ?
                    this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined
            }, cellSelected);
        }
    }
    getCellIndex(rIdx, cIdx) {
        return (this.parent.getFrozenColumns() ? (cIdx >= this.parent.getFrozenColumns() ? this.parent.getMovableCellFromIndex(rIdx, cIdx)
            : this.parent.getCellFromIndex(rIdx, cIdx)) : this.parent.getCellFromIndex(rIdx, cIdx));
    }
    /**
     * Selects a range of cells from start and end indexes.
     * @param  {IIndex} startIndex - Specifies the row and column's start index.
     * @param  {IIndex} endIndex - Specifies the row and column's end index.
     * @return {void}
     */
    selectCellsByRange(startIndex, endIndex) {
        if (!this.isCellType()) {
            return;
        }
        let gObj = this.parent;
        let selectedCell = this.getSelectedMovableCell(startIndex);
        let frzCols = gObj.getFrozenColumns();
        if (!selectedCell) {
            selectedCell = gObj.getCellFromIndex(startIndex.rowIndex, startIndex.cellIndex);
        }
        let min;
        let max;
        let stIndex = startIndex;
        let edIndex = endIndex = endIndex ? endIndex : startIndex;
        let cellIndexes;
        let cancl = 'cancel';
        this.currentIndex = startIndex.rowIndex;
        let selectedData = gObj.getCurrentViewRecords()[this.currentIndex];
        if (this.isSingleSel() || !this.isCellType() || this.isEditing()) {
            return;
        }
        let args = {
            data: selectedData, cellIndex: startIndex, currentCell: selectedCell,
            isCtrlPressed: this.isMultiCtrlRequest, isShiftPressed: this.isMultiShiftRequest, previousRowCellIndex: this.prevECIdxs,
            previousRowCell: this.prevECIdxs ? this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined
        };
        this.onActionBegin(args, cellSelecting);
        if (!isNullOrUndefined(args) && args[cancl] === true) {
            return;
        }
        this.clearCell();
        if (startIndex.rowIndex > endIndex.rowIndex) {
            let temp = startIndex;
            startIndex = endIndex;
            endIndex = temp;
        }
        for (let i = startIndex.rowIndex; i <= endIndex.rowIndex; i++) {
            if (this.selectionSettings.cellSelectionMode !== 'Box') {
                min = i === startIndex.rowIndex ? (startIndex.cellIndex) : 0;
                max = i === endIndex.rowIndex ? (endIndex.cellIndex) : this.getLastColIndex(i);
            }
            else {
                min = startIndex.cellIndex;
                max = endIndex.cellIndex;
            }
            cellIndexes = [];
            for (let j = min < max ? min : max, len = min > max ? min : max; j <= len; j++) {
                if (frzCols) {
                    if (j < frzCols) {
                        selectedCell = gObj.getCellFromIndex(i, j);
                    }
                    else {
                        selectedCell = gObj.getMovableCellFromIndex(i, j);
                    }
                }
                else {
                    selectedCell = gObj.getCellFromIndex(i, j);
                }
                if (!selectedCell) {
                    continue;
                }
                cellIndexes.push(j);
                this.updateCellSelection(selectedCell);
                this.addAttribute(selectedCell);
            }
            this.selectedRowCellIndexes.push({ rowIndex: i, cellIndexes: cellIndexes });
        }
        this.updateCellProps(stIndex, edIndex);
        this.onActionComplete({
            data: selectedData, cellIndex: startIndex, currentCell: selectedCell,
            previousRowCellIndex: this.prevECIdxs, selectedRowCellIndex: this.selectedRowCellIndexes,
            previousRowCell: this.prevECIdxs ? this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined
        }, cellSelected);
    }
    /**
     * Selects a collection of cells by row and column indexes.
     * @param  {ISelectedCell[]} rowCellIndexes - Specifies the row and column indexes.
     * @return {void}
     */
    selectCells(rowCellIndexes) {
        if (!this.isCellType()) {
            return;
        }
        let gObj = this.parent;
        let selectedCell = this.getSelectedMovableCell(rowCellIndexes[0]);
        let frzCols = gObj.getFrozenColumns();
        if (!selectedCell) {
            selectedCell = gObj.getCellFromIndex(rowCellIndexes[0].rowIndex, rowCellIndexes[0].cellIndexes[0]);
        }
        this.currentIndex = rowCellIndexes[0].rowIndex;
        let selectedData = gObj.getCurrentViewRecords()[this.currentIndex];
        if (this.isSingleSel() || !this.isCellType() || this.isEditing()) {
            return;
        }
        this.onActionBegin({
            data: selectedData, cellIndex: rowCellIndexes[0].cellIndexes[0],
            currentCell: selectedCell, isCtrlPressed: this.isMultiCtrlRequest,
            isShiftPressed: this.isMultiShiftRequest, previousRowCellIndex: this.prevECIdxs,
            previousRowCell: this.prevECIdxs ? this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined
        }, cellSelecting);
        for (let i = 0, len = rowCellIndexes.length; i < len; i++) {
            for (let j = 0, cellLen = rowCellIndexes[i].cellIndexes.length; j < cellLen; j++) {
                if (frzCols) {
                    if (rowCellIndexes[i].cellIndexes[j] < frzCols) {
                        selectedCell = gObj.getCellFromIndex(rowCellIndexes[i].rowIndex, rowCellIndexes[i].cellIndexes[j]);
                    }
                    else {
                        selectedCell = gObj.getMovableCellFromIndex(rowCellIndexes[i].rowIndex, rowCellIndexes[i].cellIndexes[j]);
                    }
                }
                else {
                    selectedCell = gObj.getCellFromIndex(rowCellIndexes[i].rowIndex, rowCellIndexes[i].cellIndexes[j]);
                }
                if (!selectedCell) {
                    continue;
                }
                this.updateCellSelection(selectedCell);
                this.addAttribute(selectedCell);
                this.addRowCellIndex({ rowIndex: rowCellIndexes[i].rowIndex, cellIndex: rowCellIndexes[i].cellIndexes[j] });
            }
        }
        this.updateCellProps({ rowIndex: rowCellIndexes[0].rowIndex, cellIndex: rowCellIndexes[0].cellIndexes[0] }, { rowIndex: rowCellIndexes[0].rowIndex, cellIndex: rowCellIndexes[0].cellIndexes[0] });
        this.onActionComplete({
            data: selectedData, cellIndex: rowCellIndexes[0].cellIndexes[0],
            currentCell: selectedCell,
            previousRowCellIndex: this.prevECIdxs, selectedRowCellIndex: this.selectedRowCellIndexes,
            previousRowCell: this.prevECIdxs ? this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined
        }, cellSelected);
    }
    /**
     * Select cells with existing cell selection by passing row and column index.
     * @param  {IIndex} startIndex - Defines the collection of row and column index.
     * @return {void}
     * @hidden
     */
    addCellsToSelection(cellIndexes) {
        if (!this.isCellType()) {
            return;
        }
        let gObj = this.parent;
        let selectedCell;
        let frzCols = gObj.getFrozenColumns();
        let index;
        this.currentIndex = cellIndexes[0].rowIndex;
        let selectedData = gObj.getCurrentViewRecords()[this.currentIndex];
        if (this.isSingleSel() || !this.isCellType() || this.isEditing()) {
            return;
        }
        let rowObj;
        if (frzCols && cellIndexes[0].cellIndex >= frzCols) {
            rowObj = gObj.getMovableRowsObject()[cellIndexes[0].rowIndex];
        }
        else {
            rowObj = this.getRowObj(cellIndexes[0].rowIndex);
        }
        let foreignKeyData$$1 = [];
        for (let cellIndex of cellIndexes) {
            for (let i = 0, len = this.selectedRowCellIndexes.length; i < len; i++) {
                if (this.selectedRowCellIndexes[i].rowIndex === cellIndex.rowIndex) {
                    index = i;
                    break;
                }
            }
            selectedCell = this.getSelectedMovableCell(cellIndex);
            if (!selectedCell) {
                selectedCell = gObj.getCellFromIndex(cellIndex.rowIndex, this.getColIndex(cellIndex.rowIndex, cellIndex.cellIndex));
            }
            foreignKeyData$$1.push(rowObj.cells[frzCols && cellIndexes[0].cellIndex >= frzCols
                ? cellIndex.cellIndex - frzCols : cellIndex.cellIndex].foreignKeyData);
            let args = {
                data: selectedData, cellIndex: cellIndexes[0],
                isShiftPressed: this.isMultiShiftRequest, previousRowCellIndex: this.prevECIdxs,
                currentCell: selectedCell, isCtrlPressed: this.isMultiCtrlRequest,
                previousRowCell: this.prevECIdxs ?
                    gObj.getCellFromIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) : undefined,
            };
            let isUnSelected = index > -1;
            if (isUnSelected) {
                let selectedCellIdx = this.selectedRowCellIndexes[index].cellIndexes;
                if (selectedCellIdx.indexOf(cellIndex.cellIndex) > -1) {
                    this.cellDeselect(cellDeselecting, [{ rowIndex: cellIndex.rowIndex, cellIndexes: [cellIndex.cellIndex] }], selectedData, [selectedCell], foreignKeyData$$1);
                    selectedCellIdx.splice(selectedCellIdx.indexOf(cellIndex.cellIndex), 1);
                    selectedCell.classList.remove('e-cellselectionbackground');
                    selectedCell.removeAttribute('aria-selected');
                    this.cellDeselect(cellDeselected, [{ rowIndex: cellIndex.rowIndex, cellIndexes: [cellIndex.cellIndex] }], selectedData, [selectedCell], foreignKeyData$$1);
                }
                else {
                    isUnSelected = false;
                    this.onActionBegin(args, cellSelecting);
                    this.addRowCellIndex({ rowIndex: cellIndex.rowIndex, cellIndex: cellIndex.cellIndex });
                    this.updateCellSelection(selectedCell);
                    this.addAttribute(selectedCell);
                }
            }
            else {
                this.onActionBegin(args, cellSelecting);
                this.updateCellSelection(selectedCell, cellIndex.rowIndex, cellIndex.cellIndex);
            }
            this.updateCellProps(cellIndex, cellIndex);
            if (!isUnSelected) {
                this.onActionComplete({
                    data: selectedData, cellIndex: cellIndexes[0], currentCell: selectedCell,
                    previousRowCell: this.prevECIdxs ? this.getCellIndex(this.prevECIdxs.rowIndex, this.prevECIdxs.cellIndex) :
                        undefined, previousRowCellIndex: this.prevECIdxs, selectedRowCellIndex: this.selectedRowCellIndexes
                }, cellSelected);
            }
        }
    }
    getColIndex(rowIndex, index) {
        let cells;
        let frzCols = this.parent.getFrozenColumns();
        if (frzCols) {
            if (index >= frzCols) {
                cells = this.parent.getMovableDataRows()[rowIndex].querySelectorAll('td.e-rowcell');
            }
        }
        if (!cells) {
            cells = this.parent.getDataRows()[rowIndex].querySelectorAll('td.e-rowcell');
        }
        for (let m = 0; m < cells.length; m++) {
            let colIndex = parseInt(cells[m].getAttribute('aria-colindex'), 10);
            if (colIndex === index) {
                if (frzCols) {
                    if (index >= frzCols) {
                        m += frzCols;
                    }
                }
                return m;
            }
        }
        return -1;
    }
    getLastColIndex(rowIndex) {
        let cells = this.parent.getFrozenColumns() ? this.parent.getMovableDataRows()[rowIndex].querySelectorAll('td.e-rowcell')
            : this.parent.getDataRows()[rowIndex].querySelectorAll('td.e-rowcell');
        return parseInt(cells[cells.length - 1].getAttribute('aria-colindex'), 10);
    }
    clearCell() {
        this.clearCellSelection();
    }
    cellDeselect(type, cellIndexes, data, cells, foreignKeyData$$1) {
        let cancl = 'cancel';
        if (cells[0] && cells[0].classList.contains('e-gridchkbox')) {
            this.updateCheckBoxes(closest(cells[0], 'tr'));
        }
        let args = {
            cells: cells, data: data, cellIndexes: cellIndexes, foreignKeyData: foreignKeyData$$1, cancel: false
        };
        this.parent.trigger(type, args);
        this.isPreventCellSelect = args[cancl];
    }
    updateCellSelection(selectedCell, rowIndex, cellIndex) {
        if (!isNullOrUndefined(rowIndex)) {
            this.addRowCellIndex({ rowIndex: rowIndex, cellIndex: cellIndex });
        }
        selectedCell.classList.add('e-cellselectionbackground');
        if (selectedCell.classList.contains('e-gridchkbox')) {
            this.updateCheckBoxes(closest(selectedCell, 'tr'), true);
        }
        this.addAttribute(selectedCell);
    }
    addAttribute(cell) {
        this.target = cell;
        if (!isNullOrUndefined(cell)) {
            cell.setAttribute('aria-selected', 'true');
            if (!this.preventFocus) {
                this.focus.onClick({ target: cell }, true);
            }
        }
    }
    updateCellProps(startIndex, endIndex) {
        this.prevCIdxs = startIndex;
        this.prevECIdxs = endIndex;
        this.isCellSelected = this.selectedRowCellIndexes.length && true;
    }
    addRowCellIndex(rowCellIndex) {
        let isRowAvail;
        let index;
        for (let i = 0, len = this.selectedRowCellIndexes.length; i < len; i++) {
            if (this.selectedRowCellIndexes[i].rowIndex === rowCellIndex.rowIndex) {
                isRowAvail = true;
                index = i;
                break;
            }
        }
        if (isRowAvail) {
            if (this.selectedRowCellIndexes[index].cellIndexes.indexOf(rowCellIndex.cellIndex) < 0) {
                this.selectedRowCellIndexes[index].cellIndexes.push(rowCellIndex.cellIndex);
            }
        }
        else {
            this.selectedRowCellIndexes.push({ rowIndex: rowCellIndex.rowIndex, cellIndexes: [rowCellIndex.cellIndex] });
        }
    }
    /**
     * Deselects the currently selected cells.
     * @return {void}
     */
    clearCellSelection() {
        if (this.isCellSelected) {
            let gObj = this.parent;
            let selectedCells = this.getSelectedCellsElement();
            let rowCell = this.selectedRowCellIndexes;
            let data = [];
            let cells = [];
            let foreignKeyData$$1 = [];
            let currentViewData = gObj.getCurrentViewRecords();
            let frzCols = gObj.getFrozenColumns();
            for (let i = 0, len = rowCell.length; i < len; i++) {
                data.push(currentViewData[rowCell[i].rowIndex]);
                let rowObj = this.getRowObj(rowCell[i].rowIndex);
                for (let j = 0, cLen = rowCell[i].cellIndexes.length; j < cLen; j++) {
                    if (frzCols) {
                        if (rowCell[i].cellIndexes[j] < frzCols) {
                            cells.push(gObj.getCellFromIndex(rowCell[i].rowIndex, rowCell[i].cellIndexes[j]));
                        }
                        else {
                            cells.push(gObj.getMovableCellFromIndex(rowCell[i].rowIndex, rowCell[i].cellIndexes[j]));
                        }
                    }
                    else {
                        foreignKeyData$$1.push(rowObj.cells[rowCell[i].cellIndexes[j]].foreignKeyData);
                        cells.push(gObj.getCellFromIndex(rowCell[i].rowIndex, rowCell[i].cellIndexes[j]));
                    }
                }
            }
            this.cellDeselect(cellDeselecting, rowCell, data, cells, foreignKeyData$$1);
            if (this.isPreventCellSelect === true) {
                return;
            }
            for (let i = 0, len = selectedCells.length; i < len; i++) {
                selectedCells[i].classList.remove('e-cellselectionbackground');
                selectedCells[i].removeAttribute('aria-selected');
            }
            this.selectedRowCellIndexes = [];
            this.isCellSelected = false;
            this.cellDeselect(cellDeselected, rowCell, data, cells, foreignKeyData$$1);
        }
    }
    getSelectedCellsElement() {
        let gObj = this.parent;
        let rows = gObj.getDataRows();
        let mRows;
        if (gObj.getFrozenColumns()) {
            mRows = gObj.getMovableDataRows();
            rows = gObj.addMovableRows(rows, mRows);
        }
        let cells = [];
        for (let i = 0, len = rows.length; i < len; i++) {
            cells = cells.concat([].slice.call(rows[i].querySelectorAll('.e-cellselectionbackground')));
        }
        return cells;
    }
    mouseMoveHandler(e) {
        e.preventDefault();
        let gBRect = this.parent.element.getBoundingClientRect();
        let x1 = this.x;
        let y1 = this.y;
        let position = getPosition(e);
        let x2 = position.x - gBRect.left;
        let y2 = position.y - gBRect.top;
        let tmp;
        let target = closest(e.target, 'tr');
        this.isDragged = true;
        if (!this.isCellDrag) {
            if (!target) {
                target = closest(document.elementFromPoint(this.parent.element.offsetLeft + 2, e.clientY), 'tr');
            }
            if (x1 > x2) {
                tmp = x2;
                x2 = x1;
                x1 = tmp;
            }
            if (y1 > y2) {
                tmp = y2;
                y2 = y1;
                y1 = tmp;
            }
            this.element.style.left = x1 + 'px';
            this.element.style.top = y1 + 'px';
            this.element.style.width = x2 - x1 + 'px';
            this.element.style.height = y2 - y1 + 'px';
        }
        if (target && !e.ctrlKey && !e.shiftKey) {
            let rowIndex = parseInt(target.getAttribute('aria-rowindex'), 10);
            if (!this.isCellDrag) {
                this.selectRowsByRange(this.startIndex, rowIndex);
            }
            else {
                let td = parentsUntil(e.target, 'e-rowcell');
                if (td) {
                    this.selectLikeExcel(rowIndex, parseInt(td.getAttribute('aria-colindex'), 10));
                }
            }
        }
    }
    selectLikeExcel(rowIndex, cellIndex) {
        this.clearCellSelection();
        this.selectCellsByRange({ rowIndex: this.startIndex, cellIndex: this.startCellIndex }, { rowIndex: rowIndex, cellIndex: cellIndex });
    }
    mouseUpHandler(e) {
        document.body.classList.remove('e-disableuserselect');
        if (this.element) {
            remove(this.element);
        }
        EventHandler.remove(this.parent.getContent(), 'mousemove', this.mouseMoveHandler);
        EventHandler.remove(document.body, 'mouseup', this.mouseUpHandler);
        this.isDragged = false;
    }
    mouseDownHandler(e) {
        let target = e.target;
        let gObj = this.parent;
        let isDrag;
        let gridElement = parentsUntil(target, 'e-grid');
        if (gridElement && gridElement.id !== gObj.element.id) {
            return;
        }
        if (e.shiftKey || e.ctrlKey) {
            e.preventDefault();
        }
        if (target.classList.contains('e-rowcell') && !e.shiftKey && !e.ctrlKey) {
            if (gObj.selectionSettings.cellSelectionMode === 'Box' && !this.isRowType() && !this.isSingleSel()) {
                this.isCellDrag = true;
                isDrag = true;
            }
            else if (gObj.allowRowDragAndDrop) {
                if (!this.isRowType() || this.isSingleSel() || closest(target, 'td').classList.contains('e-selectionbackground')) {
                    this.isDragged = false;
                    return;
                }
                isDrag = true;
                this.element = createElement('div', { className: 'e-griddragarea' });
                gObj.getContent().appendChild(this.element);
            }
            if (isDrag) {
                let tr = closest(e.target, 'tr');
                this.startIndex = parseInt(tr.getAttribute('aria-rowindex'), 10);
                this.startCellIndex = parseInt(parentsUntil(target, 'e-rowcell').getAttribute('aria-colindex'), 10);
                document.body.classList.add('e-disableuserselect');
                let gBRect = gObj.element.getBoundingClientRect();
                let postion = getPosition(e);
                this.x = postion.x - gBRect.left;
                this.y = postion.y - gBRect.top;
                EventHandler.add(gObj.getContent(), 'mousemove', this.mouseMoveHandler, this);
                EventHandler.add(document.body, 'mouseup', this.mouseUpHandler, this);
            }
        }
    }
    clearSelAfterRefresh(e) {
        if (e.requestType !== 'virtualscroll' && !this.parent.isPersistSelection) {
            this.clearSelection();
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialEnd, this.initializeSelection, this);
        this.parent.on(rowSelectionComplete, this.onActionComplete, this);
        this.parent.on(cellSelectionComplete, this.onActionComplete, this);
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(cellFocused, this.onCellFocused, this);
        this.parent.on(dataReady, this.clearSelAfterRefresh, this);
        this.parent.on(columnPositionChanged, this.columnPositionChanged, this);
        this.parent.on(contentReady, this.initialEnd, this);
        this.actionBeginFunction = this.actionBegin.bind(this);
        this.actionCompleteFunction = this.actionComplete.bind(this);
        this.parent.addEventListener(actionBegin, this.actionBeginFunction);
        this.parent.addEventListener(actionComplete, this.actionCompleteFunction);
        this.parent.on(rowsRemoved, this.rowsRemoved, this);
        this.parent.on(headerRefreshed, this.refreshHeader, this);
        this.addEventListener_checkbox();
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialEnd, this.initializeSelection);
        this.parent.off(rowSelectionComplete, this.onActionComplete);
        this.parent.off(cellSelectionComplete, this.onActionComplete);
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(cellFocused, this.onCellFocused);
        this.parent.off(dataReady, this.clearSelAfterRefresh);
        this.parent.off(columnPositionChanged, this.columnPositionChanged);
        this.parent.removeEventListener(actionBegin, this.actionBeginFunction);
        this.parent.removeEventListener(actionComplete, this.actionCompleteFunction);
        this.parent.off(rowsRemoved, this.rowsRemoved);
        this.parent.off(headerRefreshed, this.refreshHeader);
        this.removeEventListener_checkbox();
    }
    columnPositionChanged() {
        if (!this.parent.isPersistSelection) {
            this.clearSelection();
        }
    }
    refreshHeader() {
        this.setCheckAllState();
    }
    rowsRemoved(e) {
        for (let i = 0; i < e.records.length; i++) {
            delete (this.selectedRowState[e.records[i][this.primaryKey]]);
            --this.totalRecordsCount;
        }
        this.setCheckAllState();
    }
    ;
    dataReady(e) {
        if (e.requestType !== 'virtualscroll' && !this.parent.isPersistSelection) {
            this.clearSelection();
        }
    }
    ;
    getCheckAllBox() {
        return this.parent.getHeaderContent().querySelector('.e-checkselectall');
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        let gObj = this.parent;
        if (!isNullOrUndefined(e.properties.type) && this.selectionSettings.type === 'Single') {
            if (this.selectedRowCellIndexes.length > 1) {
                this.clearCellSelection();
            }
            if (this.selectedRowIndexes.length > 1) {
                this.clearRowSelection();
            }
            this.enableSelectMultiTouch = false;
            this.hidePopUp();
        }
        if (!isNullOrUndefined(e.properties.mode) ||
            !isNullOrUndefined(e.properties.cellSelectionMode)) {
            this.clearSelection();
        }
        this.checkBoxSelectionChanged();
        this.initPerisistSelection();
    }
    hidePopUp() {
        if (this.parent.element.querySelector('.e-gridpopup').querySelectorAll('.e-rowselect').length) {
            this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
        }
    }
    initialEnd() {
        this.parent.off(contentReady, this.initialEnd);
        this.selectRow(this.parent.selectedRowIndex);
    }
    checkBoxSelectionChanged() {
        this.parent.off(contentReady, this.checkBoxSelectionChanged);
        let gobj = this.parent;
        let checkboxColumn = gobj.getColumns().filter((col) => col.type === 'checkbox');
        if (checkboxColumn.length > 0) {
            gobj.isCheckBoxSelection = true;
            this.chkField = checkboxColumn[0].field;
            this.totalRecordsCount = this.parent.pageSettings.totalRecordsCount;
            if (isNullOrUndefined(this.totalRecordsCount)) {
                this.totalRecordsCount = this.parent.getCurrentViewRecords().length;
            }
            if (this.isSingleSel()) {
                gobj.selectionSettings.type = 'Multiple';
                gobj.dataBind();
            }
            else {
                this.initPerisistSelection();
            }
        }
        if (!gobj.isCheckBoxSelection) {
            this.chkField = null;
            this.initPerisistSelection();
        }
    }
    initPerisistSelection() {
        let gobj = this.parent;
        if (this.parent.selectionSettings.persistSelection && this.parent.getPrimaryKeyFieldNames().length > 0) {
            gobj.isPersistSelection = true;
            this.ensureCheckboxFieldSelection();
        }
        else if (this.parent.getPrimaryKeyFieldNames().length > 0) {
            gobj.isPersistSelection = false;
            this.ensureCheckboxFieldSelection();
        }
        else {
            gobj.isPersistSelection = false;
            this.selectedRowState = {};
        }
    }
    ensureCheckboxFieldSelection() {
        let gobj = this.parent;
        this.primaryKey = this.parent.getPrimaryKeyFieldNames()[0];
        if (!gobj.enableVirtualization && this.chkField
            && ((gobj.isPersistSelection && Object.keys(this.selectedRowState).length === 0) ||
                !gobj.isPersistSelection)) {
            let data = this.parent.getDataModule();
            let query = new Query().where(this.chkField, 'equal', true);
            let dataManager = data.getData({}, query);
            let proxy = this;
            this.parent.showSpinner();
            dataManager.then((e) => {
                proxy.dataSuccess(e.result);
                proxy.refreshPersistSelection();
                proxy.parent.hideSpinner();
            });
        }
    }
    dataSuccess(res) {
        for (let i = 0; i < res.length; i++) {
            if (isNullOrUndefined(this.selectedRowState[res[i][this.primaryKey]]) && res[i][this.chkField]) {
                this.selectedRowState[res[i][this.primaryKey]] = res[i][this.chkField];
            }
        }
        this.persistSelectedData = res;
    }
    setRowSelection(state) {
        if (!this.parent.getDataModule().isRemote()) {
            if (state) {
                for (let data of this.getData()) {
                    this.selectedRowState[data[this.primaryKey]] = true;
                }
            }
            else {
                this.selectedRowState = {};
            }
            // (this.getData()).forEach(function (data) {
            //     this.selectedRowState[data[this.primaryKey]] = true;
            // })
        }
    }
    getData() {
        return this.parent.getDataModule().dataManager.dataSource.json;
    }
    refreshPersistSelection() {
        let rows = this.parent.getRows();
        if (rows.length > 0 && (this.parent.isPersistSelection || this.chkField)) {
            let indexes = [];
            for (let j = 0; j < rows.length; j++) {
                let rowObj = this.getRowObj(rows[j]);
                let pKey = rowObj ? rowObj.data[this.primaryKey] : null;
                if (pKey === null) {
                    return;
                }
                let checkState;
                let chkBox = rows[j].querySelector('.e-checkselect');
                if (this.selectedRowState[pKey] || (this.parent.checkAllRows === 'Check' && this.chkAllCollec.indexOf(pKey) < 0)
                    || (this.parent.checkAllRows === 'Uncheck' && this.chkAllCollec.indexOf(pKey) > 0)
                    || (this.parent.checkAllRows === 'Intermediate' && !isNullOrUndefined(this.chkField) && rowObj.data[this.chkField])) {
                    indexes.push(parseInt(rows[j].getAttribute('aria-rowindex'), 10));
                    checkState = true;
                }
                else {
                    checkState = false;
                    if (this.checkedTarget !== chkBox && this.parent.isCheckBoxSelection) {
                        removeAddCboxClasses(chkBox.nextElementSibling, checkState);
                    }
                }
                this.updatePersistCollection(rows[j], checkState);
            }
            this.isSingleSel() && indexes.length > 0 ? this.selectRow(indexes[0], true) : this.selectRows(indexes);
        }
        if (this.parent.isCheckBoxSelection && this.parent.getCurrentViewRecords().length > 0) {
            this.setCheckAllState();
        }
    }
    actionBegin(e) {
        if (e.requestType === 'save' && this.parent.isPersistSelection) {
            let editChkBox = this.parent.element.querySelector('.e-edit-checkselect');
            if (!isNullOrUndefined(editChkBox)) {
                let row = closest(editChkBox, '.e-editedrow');
                if (row) {
                    if (this.parent.editSettings.mode === 'Dialog') {
                        row = this.parent.element.querySelector('.e-dlgeditrow');
                    }
                    let rowObj = this.getRowObj(row);
                    if (!rowObj) {
                        return;
                    }
                    this.selectedRowState[rowObj.data[this.primaryKey]] = rowObj.isSelected = editChkBox.checked;
                }
                else {
                    this.isCheckedOnAdd = editChkBox.checked;
                }
            }
        }
    }
    actionComplete(e) {
        if (e.requestType === 'save' && this.parent.isPersistSelection) {
            if (e.action === 'add' && this.isCheckedOnAdd) {
                let rowObj = this.parent.getRowObjectFromUID(this.parent.getRows()[e.selectedRow].getAttribute('data-uid'));
                this.selectedRowState[rowObj.data[this.primaryKey]] = rowObj.isSelected = this.isCheckedOnAdd;
            }
            this.refreshPersistSelection();
        }
    }
    onDataBound() {
        if (!this.parent.enableVirtualization && this.parent.isPersistSelection) {
            this.refreshPersistSelection();
        }
    }
    checkSelectAllAction(checkState) {
        let cRenderer = this.getRenderer();
        let editForm = this.parent.element.querySelector('.e-gridform');
        this.checkedTarget = this.getCheckAllBox();
        if (checkState && this.parent.getCurrentViewRecords().length) {
            this.selectRowsByRange(cRenderer.getVirtualRowIndex(0), cRenderer.getVirtualRowIndex(this.parent.getCurrentViewRecords().length));
            this.parent.checkAllRows = 'Check';
        }
        else {
            this.clearSelection();
            this.parent.checkAllRows = 'Uncheck';
        }
        this.chkAllCollec = [];
        if (this.parent.isPersistSelection) {
            let rows = this.parent.getRows();
            for (let i = 0; i < rows.length; i++) {
                this.updatePersistCollection(rows[i], checkState);
            }
            if (this.parent.checkAllRows === 'Uncheck') {
                this.setRowSelection(false);
                this.persistSelectedData = [];
            }
            else if (this.parent.checkAllRows === 'Check') {
                this.setRowSelection(true);
                this.persistSelectedData = this.getData().slice();
            }
        }
        if (!isNullOrUndefined(editForm)) {
            let editChkBox = editForm.querySelector('.e-edit-checkselect');
            removeAddCboxClasses(editChkBox.nextElementSibling, checkState);
        }
    }
    checkSelectAll(checkBox) {
        let state = this.getCheckAllStatus(checkBox) === 'Check';
        this.checkSelectAllAction(!state);
        this.target = null;
        if (this.parent.getCurrentViewRecords().length > 0) {
            this.setCheckAllState();
        }
        this.triggerChkChangeEvent(checkBox, !state);
    }
    getCheckAllStatus(ele) {
        let classes = ele ? ele.nextElementSibling.classList :
            this.getCheckAllBox().nextElementSibling.classList;
        let status;
        if (classes.contains('e-check')) {
            status = 'Check';
        }
        else if (classes.contains('e-uncheck')) {
            status = 'Uncheck';
        }
        else if (classes.contains('e-stop')) {
            status = 'Intermediate';
        }
        else {
            status = 'None';
        }
        return status;
    }
    checkSelect(checkBox) {
        let target = closest(this.checkedTarget, '.e-rowcell');
        this.isMultiCtrlRequest = true;
        let rIndex = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10);
        if (this.parent.isPersistSelection && this.parent.element.querySelectorAll('.e-addedrow').length > 0) {
            ++rIndex;
        }
        this.rowCellSelectionHandler(rIndex, parseInt(target.getAttribute('aria-colindex'), 10));
        this.moveIntoUncheckCollection(closest(target, '.e-row'));
        this.setCheckAllState();
        this.isMultiCtrlRequest = false;
        this.triggerChkChangeEvent(checkBox, checkBox.nextElementSibling.classList.contains('e-check'));
    }
    moveIntoUncheckCollection(row) {
        if (this.parent.checkAllRows === 'Check' || this.parent.checkAllRows === 'Uncheck') {
            let rowObj = this.getRowObj(row);
            let pKey = rowObj && rowObj.data ? rowObj.data[this.primaryKey] : null;
            if (!pKey) {
                return;
            }
            if (this.chkAllCollec.indexOf(pKey) < 0) {
                this.chkAllCollec.push(pKey);
            }
            else {
                this.chkAllCollec.splice(this.chkAllCollec.indexOf(pKey), 1);
            }
        }
    }
    triggerChkChangeEvent(checkBox, checkState) {
        this.parent.trigger(checkBoxChange, {
            checked: checkState, selectedRowIndexes: this.parent.getSelectedRowIndexes(),
            target: checkBox
        });
        if (!this.parent.isEdit) {
            this.checkedTarget = null;
        }
    }
    setCheckAllState(isInteraction) {
        if (this.parent.isCheckBoxSelection) {
            let checkedLen = Object.keys(this.selectedRowState).length;
            if (!this.parent.isPersistSelection) {
                checkedLen = this.selectedRecords.length;
                this.totalRecordsCount = this.parent.getCurrentViewRecords().length;
            }
            if (this.getCheckAllBox()) {
                let spanEle = this.getCheckAllBox().nextElementSibling;
                removeClass([spanEle], ['e-check', 'e-stop', 'e-uncheck']);
                if (checkedLen === this.totalRecordsCount) {
                    addClass([spanEle], ['e-check']);
                    if (isInteraction) {
                        this.getRenderer().setSelection(null, true, true);
                    }
                    this.parent.checkAllRows = 'Check';
                }
                else if (checkedLen === 0 || this.parent.getCurrentViewRecords().length === 0) {
                    addClass([spanEle], ['e-uncheck']);
                    if (isInteraction) {
                        this.getRenderer().setSelection(null, false, true);
                    }
                    this.parent.checkAllRows = 'Uncheck';
                }
                else {
                    addClass([spanEle], ['e-stop']);
                    this.parent.checkAllRows = 'Intermediate';
                }
            }
        }
    }
    clickHandler(e) {
        let target = e.target;
        this.isMultiCtrlRequest = e.ctrlKey || this.enableSelectMultiTouch;
        this.isMultiShiftRequest = e.shiftKey;
        this.popUpClickHandler(e);
        let chkSelect = false;
        this.preventFocus = true;
        let checkBox;
        let checkWrap = parentsUntil(target, 'e-checkbox-wrapper');
        if (checkWrap && checkWrap.querySelectorAll('.e-checkselect,.e-checkselectall').length > 0) {
            checkBox = checkWrap.querySelector('input[type="checkbox"]');
            chkSelect = true;
        }
        target = parentsUntil(target, 'e-rowcell');
        if ((target && target.parentElement.classList.contains('e-row') && !this.parent.selectionSettings.checkboxOnly) || chkSelect) {
            if (this.parent.isCheckBoxSelection) {
                this.isMultiCtrlRequest = true;
            }
            this.target = target;
            if (!isNullOrUndefined(checkBox)) {
                this.checkedTarget = checkBox;
                if (checkBox.classList.contains('e-checkselectall')) {
                    this.checkSelectAll(checkBox);
                }
                else {
                    this.checkSelect(checkBox);
                    this.target = closest(target, '.e-rowcell');
                }
            }
            else {
                let rIndex = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10);
                if (this.parent.isPersistSelection && this.parent.element.querySelectorAll('.e-addedrow').length > 0) {
                    ++rIndex;
                }
                this.rowCellSelectionHandler(rIndex, parseInt(target.getAttribute('aria-colindex'), 10));
                if (this.parent.isCheckBoxSelection) {
                    this.moveIntoUncheckCollection(closest(target, '.e-row'));
                    this.setCheckAllState();
                }
            }
            if (!this.parent.isCheckBoxSelection && Browser.isDevice && !this.isSingleSel()) {
                this.showPopup(e);
            }
        }
        this.isMultiCtrlRequest = false;
        this.isMultiShiftRequest = false;
        this.preventFocus = false;
    }
    popUpClickHandler(e) {
        let target = e.target;
        if (closest(target, '.e-headercell') || e.target.classList.contains('e-rowcell') ||
            closest(target, '.e-gridpopup')) {
            if (target.classList.contains('e-rowselect')) {
                if (!target.classList.contains('e-spanclicked')) {
                    target.classList.add('e-spanclicked');
                    this.enableSelectMultiTouch = true;
                }
                else {
                    target.classList.remove('e-spanclicked');
                    this.enableSelectMultiTouch = false;
                    this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
                }
            }
        }
        else {
            this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
        }
    }
    showPopup(e) {
        setCssInGridPopUp(this.parent.element.querySelector('.e-gridpopup'), e, 'e-rowselect e-icons e-icon-rowselect' +
            (!this.isSingleSel() && (this.selectedRecords.length > (this.parent.getFrozenColumns() ? 2 : 1)
                || this.selectedRowCellIndexes.length > 1) ? ' e-spanclicked' : ''));
    }
    rowCellSelectionHandler(rowIndex, cellIndex) {
        if ((!this.isMultiCtrlRequest && !this.isMultiShiftRequest) || this.isSingleSel()) {
            if (!this.isDragged) {
                this.selectRow(rowIndex, true);
            }
            this.selectCell({ rowIndex: rowIndex, cellIndex: cellIndex }, true);
        }
        else if (this.isMultiShiftRequest) {
            this.selectRowsByRange(isUndefined(this.prevRowIndex) ? rowIndex : this.prevRowIndex, rowIndex);
            this.selectCellsByRange(isUndefined(this.prevCIdxs) ? { rowIndex: rowIndex, cellIndex: cellIndex } : this.prevCIdxs, { rowIndex: rowIndex, cellIndex: cellIndex });
        }
        else {
            this.addRowsToSelection([rowIndex]);
            this.addCellsToSelection([{ rowIndex: rowIndex, cellIndex: cellIndex }]);
        }
        this.isDragged = false;
    }
    onCellFocused(e) {
        if (this.parent.frozenRows && e.container.isHeader && e.byKey) {
            if (e.keyArgs.action === 'upArrow') {
                if (this.parent.allowFiltering) {
                    e.isJump = e.element.tagName === 'INPUT' ? true : false;
                }
                else {
                    e.isJump = e.element.tagName === 'TH' ? true : false;
                }
            }
            else {
                if (e.keyArgs.action === 'downArrow') {
                    let rIdx = Number(e.element.parentElement.getAttribute('aria-rowindex'));
                    e.isJump = rIdx === 0 ? true : false;
                }
                else {
                    if (e.keyArgs.action === 'ctrlHome') {
                        e.isJump = true;
                    }
                }
            }
        }
        let clear = this.parent.getFrozenColumns() ? (((e.container.isHeader && e.element.tagName !== 'TD' && e.isJump) ||
            ((e.container.isContent || e.element.tagName === 'TD') && !(e.container.isSelectable || e.element.tagName === 'TD')))
            && !(e.byKey && e.keyArgs.action === 'space')) : ((e.container.isHeader && e.isJump) ||
            (e.container.isContent && !e.container.isSelectable)) && !(e.byKey && e.keyArgs.action === 'space');
        let headerAction = (e.container.isHeader && e.element.tagName !== 'TD' && !closest(e.element, '.e-rowcell'))
            && !(e.byKey && e.keyArgs.action === 'space');
        if (!e.byKey || clear) {
            if (clear) {
                this.clearSelection();
            }
            return;
        }
        let [rowIndex, cellIndex] = e.container.isContent ? e.container.indexes : e.indexes;
        let prev = this.focus.getPrevIndexes();
        if (this.parent.frozenRows) {
            if (e.container.isHeader && (e.element.tagName === 'TD' || closest(e.element, '.e-rowcell'))) {
                let thLen = this.parent.getHeaderTable().querySelector('thead').childElementCount;
                rowIndex -= thLen;
                prev.rowIndex = prev.rowIndex ? prev.rowIndex - thLen : null;
            }
            else {
                rowIndex += this.parent.frozenRows;
                prev.rowIndex = prev.rowIndex === 0 || !isNullOrUndefined(prev.rowIndex) ? prev.rowIndex + this.parent.frozenRows : null;
            }
            if (this.parent.getFrozenColumns()) {
                let cIdx = Number(e.element.getAttribute('aria-colindex'));
                prev.cellIndex = prev.cellIndex ? (prev.cellIndex === cellIndex ? cIdx : cIdx - 1) : null;
                cellIndex = cIdx;
            }
        }
        if (headerAction || (['ctrlPlusA', 'escape'].indexOf(e.keyArgs.action) === -1 && e.keyArgs.action !== 'space' &&
            rowIndex === prev.rowIndex && cellIndex === prev.cellIndex)) {
            return;
        }
        this.preventFocus = true;
        switch (e.keyArgs.action) {
            case 'downArrow':
            case 'upArrow':
            case 'enter':
            case 'shiftEnter':
                this.applyDownUpKey(rowIndex, cellIndex);
                break;
            case 'rightArrow':
            case 'leftArrow':
                this.applyRightLeftKey(rowIndex, cellIndex);
                break;
            case 'shiftDown':
            case 'shiftUp':
                this.shiftDownKey(rowIndex, cellIndex);
                break;
            case 'shiftLeft':
            case 'shiftRight':
                this.applyShiftLeftRightKey(rowIndex, cellIndex);
                break;
            case 'home':
            case 'end':
                cellIndex = e.keyArgs.action === 'end' ? this.getLastColIndex(rowIndex) : 0;
                this.applyHomeEndKey(rowIndex, cellIndex);
                break;
            case 'ctrlHome':
            case 'ctrlEnd':
                this.applyCtrlHomeEndKey(rowIndex, cellIndex);
                break;
            case 'escape':
                this.clearSelection();
                break;
            case 'ctrlPlusA':
                this.ctrlPlusA();
                break;
            case 'space':
                this.applySpaceSelection(e.element);
                break;
        }
        this.preventFocus = false;
    }
    /**
     * Apply ctrl + A key selection
     * @return {void}
     * @hidden
     */
    ctrlPlusA() {
        if (this.isRowType() && !this.isSingleSel()) {
            this.selectRowsByRange(0, this.parent.getRows().length - 1);
        }
        if (this.isCellType() && !this.isSingleSel()) {
            this.selectCellsByRange({ rowIndex: 0, cellIndex: 0 }, { rowIndex: this.parent.getRows().length - 1, cellIndex: this.parent.getColumns().length - 1 });
        }
    }
    applySpaceSelection(target) {
        if (target.classList.contains('e-checkselectall')) {
            this.checkedTarget = target;
            this.checkSelectAll(this.checkedTarget);
        }
        else {
            if (target.classList.contains('e-checkselect')) {
                this.checkedTarget = target;
                this.checkSelect(this.checkedTarget);
            }
        }
    }
    applyDownUpKey(rowIndex, cellIndex) {
        let gObj = this.parent;
        if (this.parent.isCheckBoxSelection && this.parent.checkAllRows === 'Check') {
            this.checkSelectAllAction(false);
            this.checkedTarget = null;
        }
        if (this.isRowType()) {
            if (this.parent.frozenRows) {
                this.selectRow(rowIndex, true);
                this.applyUpDown(gObj.selectedRowIndex);
            }
            else {
                this.selectRow(rowIndex, true);
                this.applyUpDown(gObj.selectedRowIndex);
            }
        }
        if (this.isCellType()) {
            this.selectCell({ rowIndex, cellIndex }, true);
        }
    }
    applyUpDown(rowIndex) {
        if (rowIndex < 0) {
            return;
        }
        if (!this.target) {
            this.target = this.parent.getRows()[0].children[this.parent.groupSettings.columns.length || 0];
        }
        let cIndex = parseInt(this.target.getAttribute('aria-colindex'), 10);
        let frzCols = this.parent.getFrozenColumns();
        if (frzCols) {
            if (cIndex >= frzCols) {
                this.target =
                    this.contentRenderer.getMovableRowByIndex(rowIndex).querySelectorAll('.e-rowcell')[cIndex - frzCols];
            }
            else {
                this.target = this.contentRenderer.getRowByIndex(rowIndex).querySelectorAll('.e-rowcell')[cIndex];
            }
        }
        else {
            this.target = this.contentRenderer.getRowByIndex(rowIndex).querySelectorAll('.e-rowcell')[cIndex];
        }
        this.addAttribute(this.target);
    }
    applyRightLeftKey(rowIndex, cellIndex) {
        let gObj = this.parent;
        if (this.isCellType()) {
            this.selectCell({ rowIndex, cellIndex }, true);
            this.addAttribute(this.target);
        }
    }
    applyHomeEndKey(rowIndex, cellIndex) {
        if (this.isCellType()) {
            this.selectCell({ rowIndex, cellIndex }, true);
        }
        else {
            this.addAttribute(this.parent.getCellFromIndex(rowIndex, cellIndex));
        }
    }
    /**
     * Apply shift+down key selection
     * @return {void}
     * @hidden
     */
    shiftDownKey(rowIndex, cellIndex) {
        let gObj = this.parent;
        this.isMultiShiftRequest = true;
        if (this.isRowType() && !this.isSingleSel()) {
            if (!isUndefined(this.prevRowIndex)) {
                this.selectRowsByRange(this.prevRowIndex, rowIndex);
                this.applyUpDown(rowIndex);
            }
            else {
                this.selectRow(0, true);
            }
        }
        if (this.isCellType() && !this.isSingleSel()) {
            this.selectCellsByRange(this.prevCIdxs || { rowIndex: 0, cellIndex: 0 }, { rowIndex, cellIndex });
        }
        this.isMultiShiftRequest = false;
    }
    applyShiftLeftRightKey(rowIndex, cellIndex) {
        let gObj = this.parent;
        this.isMultiShiftRequest = true;
        this.selectCellsByRange(this.prevCIdxs, { rowIndex, cellIndex });
        this.isMultiShiftRequest = false;
    }
    applyCtrlHomeEndKey(rowIndex, cellIndex) {
        if (this.isRowType()) {
            this.selectRow(rowIndex, true);
            this.addAttribute(this.parent.getCellFromIndex(rowIndex, cellIndex));
        }
        if (this.isCellType()) {
            this.selectCell({ rowIndex, cellIndex }, true);
        }
    }
    addRemoveClassesForRow(row, isAdd, clearAll, ...args) {
        if (row) {
            let cells = [].slice.call(row.querySelectorAll('.e-rowcell'));
            let cell = row.querySelector('.e-detailrowcollapse') || row.querySelector('.e-detailrowexpand');
            if (cell) {
                cells.push(cell);
            }
            addRemoveActiveClasses(cells, isAdd, ...args);
        }
        this.getRenderer().setSelection(row ? row.getAttribute('data-uid') : null, isAdd, clearAll);
    }
    isRowType() {
        return this.selectionSettings.mode === 'Row' || this.selectionSettings.mode === 'Both';
    }
    isCellType() {
        return this.selectionSettings.mode === 'Cell' || this.selectionSettings.mode === 'Both';
    }
    isSingleSel() {
        return this.selectionSettings.type === 'Single';
    }
    getRenderer() {
        if (isNullOrUndefined(this.contentRenderer)) {
            this.contentRenderer = this.factory.getRenderer(RenderType.Content);
        }
        return this.contentRenderer;
    }
    /**
     * Gets the collection of selected records.
     * @return {Object[]}
     */
    getSelectedRecords() {
        let selectedData = [];
        if (!this.selectionSettings.persistSelection) {
            selectedData = this.parent.getRowsObject().filter((row) => row.isSelected)
                .map((m) => m.data);
        }
        else {
            selectedData = this.persistSelectedData;
        }
        return selectedData;
    }
    addEventListener_checkbox() {
        this.parent.on(dataReady, this.dataReady, this);
        this.onDataBoundFunction = this.onDataBound.bind(this);
        this.parent.addEventListener(dataBound, this.onDataBoundFunction);
        this.parent.on(contentReady, this.checkBoxSelectionChanged, this);
        this.actionCompleteFunc = this.actionCompleteHandler.bind(this);
        this.parent.addEventListener(actionComplete, this.actionCompleteFunc);
        this.parent.on(click, this.clickHandler, this);
    }
    removeEventListener_checkbox() {
        this.parent.off(dataReady, this.dataReady);
        this.parent.removeEventListener(dataBound, this.onDataBoundFunction);
        this.parent.removeEventListener(actionComplete, this.actionCompleteFunc);
        this.parent.off(click, this.clickHandler);
    }
    actionCompleteHandler(e) {
        if (e.requestType === 'save' && this.parent.isPersistSelection) {
            this.refreshPersistSelection();
        }
    }
}

/**
 * The `Search` module is used to handle search action.
 */
class Search {
    /**
     * Constructor for Grid search module.
     * @hidden
     */
    constructor(parent) {
        this.parent = parent;
        this.addEventListener();
    }
    /**
     * Searches Grid records by given key.
     *
     * > You can customize the default search action by using [`searchSettings`](./api-grid.html#searchsettings-searchsettingsmodel).
     * @param  {string} searchString - Defines the key.
     * @return {void}
     */
    search(searchString) {
        let gObj = this.parent;
        searchString = isNullOrUndefined(searchString) ? '' : searchString;
        if (isActionPrevent(gObj)) {
            gObj.notify(preventBatch, { instance: this, handler: this.search, arg1: searchString });
            return;
        }
        if (searchString !== gObj.searchSettings.key) {
            gObj.searchSettings.key = searchString.toString();
            gObj.dataBind();
        }
        else if (this.refreshSearch) {
            gObj.refresh();
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(searchComplete, this.onSearchComplete, this);
        this.parent.on(destroy, this.destroy, this);
        this.actionCompleteFunc = this.onActionComplete.bind(this);
        this.parent.addEventListener(actionComplete, this.actionCompleteFunc);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(searchComplete, this.onSearchComplete);
        this.parent.off(destroy, this.destroy);
        this.parent.removeEventListener(actionComplete, this.actionCompleteFunc);
    }
    /**
     * To destroy the print
     * @return {void}
     * @hidden
     */
    destroy() {
        this.removeEventListener();
    }
    /**
     * @hidden
     */
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        if (!isNullOrUndefined(e.properties.key)) {
            this.parent.notify(modelChanged, {
                requestType: 'searching', type: actionBegin, searchString: this.parent.searchSettings.key
            });
        }
        else {
            this.parent.notify(modelChanged, {
                requestType: 'searching', type: actionBegin
            });
        }
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onSearchComplete(e) {
        this.parent.trigger(actionComplete, extend(e, {
            searchString: this.parent.searchSettings.key, requestType: 'searching', type: actionComplete
        }));
    }
    onActionComplete(e) {
        this.refreshSearch = e.requestType !== 'searching';
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'search';
    }
}

/**
 * The `ShowHide` module is used to control column visibility.
 */
class ShowHide {
    /**
     * Constructor for the show hide module.
     * @hidden
     */
    constructor(parent) {
        this.parent = parent;
    }
    /**
     * Shows a column by column name.
     * @param  {string|string[]} columnName - Defines a single or collection of column names to show.
     * @param  {string} showBy - Defines the column key either as field name or header text.
     * @return {void}
     */
    show(columnName, showBy) {
        let keys = this.getToggleFields(columnName);
        let columns = this.getColumns(keys, showBy);
        this.parent.notify(tooltipDestroy, { module: 'edit' });
        columns.forEach((value) => {
            value.visible = true;
        });
        this.setVisible(columns);
    }
    /**
     * Hides a column by column name.
     * @param  {string|string[]} columnName - Defines a single or collection of column names to hide.
     * @param  {string} hideBy - Defines the column key either as field name or header text.
     * @return {void}
     */
    hide(columnName, hideBy) {
        let keys = this.getToggleFields(columnName);
        let columns = this.getColumns(keys, hideBy);
        this.parent.notify(tooltipDestroy, { module: 'edit' });
        columns.forEach((value) => {
            value.visible = false;
        });
        this.setVisible(columns);
    }
    getToggleFields(key) {
        let finalized = [];
        if (typeof key === 'string') {
            finalized = [key];
        }
        else {
            finalized = key;
        }
        return finalized;
    }
    getColumns(keys, getKeyBy) {
        let columns = iterateArrayOrObject(keys, (key, index) => {
            return iterateArrayOrObject(this.parent.getColumns(), (item, index) => {
                if (item[getKeyBy] === key) {
                    return item;
                }
                return undefined;
            })[0];
        });
        return columns;
    }
    /**
     * Shows or hides columns by given column collection.
     * @private
     * @param  {Column[]} columns - Specifies the columns.
     * @return {void}
     */
    setVisible(columns) {
        if (isActionPrevent(this.parent)) {
            this.parent.notify(preventBatch, {
                instance: this, handler: this.setVisible,
                arg1: columns
            });
            return;
        }
        columns = isNullOrUndefined(columns) ? this.parent.getColumns() : columns;
        if (this.parent.allowSelection && this.parent.getSelectedRecords().length) {
            this.parent.clearSelection();
        }
        this.parent.notify(columnVisibilityChanged, columns);
    }
}

/**
 * The `Scroll` module is used to handle scrolling behaviour.
 */
class Scroll {
    /**
     * Constructor for the Grid scrolling.
     * @hidden
     */
    constructor(parent) {
        this.lastScrollTop = 0;
        //To maintain scroll state on grid actions.
        this.previousValues = { top: 0, left: 0 };
        this.oneTimeReady = true;
        this.parent = parent;
        this.widthService = new ColumnWidthService(parent);
        this.addEventListener();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'scroll';
    }
    /**
     * @hidden
     */
    setWidth() {
        this.parent.element.style.width = formatUnit(this.parent.width);
        if (this.parent.toolbarModule && this.parent.toolbarModule.toolbar &&
            this.parent.toolbarModule.toolbar.element) {
            this.parent.toolbarModule.toolbar.refreshOverflow();
        }
    }
    /**
     * @hidden
     */
    setHeight() {
        let mHdrHeight = 0;
        let content = this.parent.getContent().firstChild;
        if (this.parent.frozenRows && this.parent.height !== 'auto') {
            mHdrHeight =
                this.parent.getHeaderContent().querySelector('tbody').offsetHeight;
            content.style.height = formatUnit(this.parent.height - mHdrHeight);
        }
        else {
            content.style.height = formatUnit(this.parent.height);
        }
        this.ensureOverflow(content);
    }
    /**
     * @hidden
     */
    setPadding() {
        let content = this.parent.getHeaderContent();
        let scrollWidth = Scroll.getScrollBarWidth() - this.getThreshold();
        let cssProps = this.getCssProperties();
        content.firstChild.style[cssProps.border] = scrollWidth > 0 ? '1px' : '0px';
        content.style[cssProps.padding] = scrollWidth > 0 ? scrollWidth + 'px' : '0px';
    }
    /**
     * @hidden
     */
    removePadding(rtl) {
        let cssProps = this.getCssProperties(rtl);
        this.parent.getHeaderContent().firstChild.style[cssProps.border] = '';
        this.parent.getHeaderContent().firstChild.parentElement.style[cssProps.padding] = '';
    }
    /**
     * Refresh makes the Grid adoptable with the height of parent container.
     *
     * > The [`height`](./api-grid.html#height) must be set to 100%.
     * @return
     */
    refresh() {
        if (this.parent.height !== '100%') {
            return;
        }
        let content = this.parent.getContent();
        this.parent.element.style.height = '100%';
        let height = this.widthService.getSiblingsHeight(content);
        content.style.height = 'calc(100% - ' + height + 'px)'; //Set the height to the '.e-gridcontent';
    }
    getThreshold() {
        /* Some browsers places the scroller outside the content,
         * hence the padding should be adjusted.*/
        let appName = Browser.info.name;
        if (appName === 'mozilla') {
            return 0.5;
        }
        return 1;
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(onEmpty, this.wireEvents, this);
        this.parent.on(contentReady, this.wireEvents, this);
        this.parent.on(uiUpdate, this.onPropertyChanged, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(onEmpty, this.wireEvents);
        this.parent.off(contentReady, this.wireEvents);
        this.parent.off(uiUpdate, this.onPropertyChanged);
    }
    onContentScroll(scrollTarget) {
        let element = scrollTarget;
        let isHeader = element.classList.contains('e-headercontent');
        return (e) => {
            if (this.content.querySelector('tbody') === null) {
                return;
            }
            let target = e.target;
            let left = target.scrollLeft;
            let sLimit = target.scrollWidth;
            let isFooter = target.classList.contains('e-summarycontent');
            if (this.previousValues.left === left) {
                this.previousValues.top = !isHeader ? this.previousValues.top : target.scrollTop;
                return;
            }
            element.scrollLeft = left;
            if (isFooter) {
                this.header.scrollLeft = left;
            }
            this.previousValues.left = left;
            this.parent.notify(scroll, { left: left });
        };
    }
    onFreezeContentScroll(scrollTarget) {
        let element = scrollTarget;
        return (e) => {
            if (this.content.querySelector('tbody') === null) {
                return;
            }
            let target = e.target;
            let top = target.scrollTop;
            if (this.previousValues.top === top) {
                return;
            }
            element.scrollTop = top;
            this.previousValues.top = top;
            if (this.parent.isDestroyed) {
                return;
            }
        };
    }
    onWheelScroll(scrollTarget) {
        let element = scrollTarget;
        return (e) => {
            if (this.content.querySelector('tbody') === null) {
                return;
            }
            let top = element.scrollTop + e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
            if (this.previousValues.top === top) {
                return;
            }
            e.preventDefault();
            this.parent.getContent().querySelector('.e-frozencontent').scrollTop = top;
            element.scrollTop = top;
            this.previousValues.top = top;
        };
    }
    onTouchScroll(scrollTarget) {
        let element = scrollTarget;
        return (e) => {
            if (e.pointerType === 'mouse') {
                return;
            }
            let cont;
            let mHdr;
            let pageXY = this.getPointXY(e);
            let top = element.scrollTop + (this.pageXY.y - pageXY.y);
            let left = element.scrollLeft + (this.pageXY.x - pageXY.x);
            if (this.parent.getHeaderContent().contains(e.target)) {
                mHdr = this.parent.getFrozenColumns() ?
                    this.parent.getHeaderContent().querySelector('.e-movableheader') : this.parent.getHeaderContent().firstChild;
                if (this.previousValues.left === left || (left < 0 || (mHdr.scrollWidth - mHdr.clientWidth) < left)) {
                    return;
                }
                e.preventDefault();
                mHdr.scrollLeft = left;
                element.scrollLeft = left;
                this.pageXY.x = pageXY.x;
                this.previousValues.left = left;
            }
            else {
                cont = this.parent.getContent().querySelector('.e-frozencontent');
                if (this.previousValues.top === top || (top < 0 || (cont.scrollHeight - cont.clientHeight) < top)) {
                    return;
                }
                e.preventDefault();
                cont.scrollTop = top;
                element.scrollTop = top;
                this.pageXY.y = pageXY.y;
                this.previousValues.top = top;
            }
        };
    }
    setPageXY() {
        return (e) => {
            if (e.pointerType === 'mouse') {
                return;
            }
            this.pageXY = this.getPointXY(e);
        };
    }
    getPointXY(e) {
        let pageXY = { x: 0, y: 0 };
        if (e.touches && e.touches.length) {
            pageXY.x = e.touches[0].pageX;
            pageXY.y = e.touches[0].pageY;
        }
        else {
            pageXY.x = e.pageX;
            pageXY.y = e.pageY;
        }
        return pageXY;
    }
    wireEvents() {
        if (this.oneTimeReady) {
            let frzCols = this.parent.getFrozenColumns();
            this.content = this.parent.getContent().firstChild;
            this.header = this.parent.getHeaderContent().firstChild;
            let mCont = this.content.querySelector('.e-movablecontent');
            let fCont = this.content.querySelector('.e-frozencontent');
            let mHdr = this.header.querySelector('.e-movableheader');
            if (this.parent.frozenRows) {
                EventHandler.add(frzCols ? mHdr : this.header, 'touchstart pointerdown', this.setPageXY(), this);
                EventHandler.add(frzCols ? mHdr : this.header, 'touchmove pointermove', this.onTouchScroll(frzCols ? mCont : this.content), this);
            }
            if (frzCols) {
                EventHandler.add(mCont, 'scroll', this.onContentScroll(mHdr), this);
                EventHandler.add(mCont, 'scroll', this.onFreezeContentScroll(fCont), this);
                EventHandler.add(fCont, 'scroll', this.onFreezeContentScroll(mCont), this);
                EventHandler.add(mHdr, 'scroll', this.onContentScroll(mCont), this);
                EventHandler.add(fCont, 'wheel', this.onWheelScroll(mCont), this);
                EventHandler.add(fCont, 'touchstart pointerdown', this.setPageXY(), this);
                EventHandler.add(fCont, 'touchmove pointermove', this.onTouchScroll(mCont), this);
            }
            else {
                EventHandler.add(this.content, 'scroll', this.onContentScroll(this.header), this);
                EventHandler.add(this.header, 'scroll', this.onContentScroll(this.content), this);
            }
            if (this.parent.aggregates.length) {
                EventHandler.add(this.parent.getFooterContent().firstChild, 'scroll', this.onContentScroll(this.content), this);
            }
            this.refresh();
            this.oneTimeReady = false;
        }
        let table = this.parent.getContentTable();
        if (table.scrollHeight < this.parent.getContent().clientHeight) {
            addClass(table.querySelectorAll('tr:last-child td'), 'e-lastrowcell');
            if (this.parent.getFrozenColumns()) {
                addClass(this.parent.getContent().querySelector('.e-movablecontent').querySelectorAll('tr:last-child td'), 'e-lastrowcell');
            }
        }
        if (!this.parent.enableVirtualization) {
            this.content.scrollLeft = this.header.scrollLeft;
            this.content.scrollTop = this.previousValues.top;
        }
        if (!this.parent.enableColumnVirtualization) {
            this.content.scrollLeft = this.header.scrollLeft;
        }
    }
    /**
     * @hidden
     */
    getCssProperties(rtl) {
        let css = {};
        let enableRtl = isNullOrUndefined(rtl) ? this.parent.enableRtl : rtl;
        css.border = enableRtl ? 'borderLeftWidth' : 'borderRightWidth';
        css.padding = enableRtl ? 'paddingLeft' : 'paddingRight';
        return css;
    }
    ensureOverflow(content) {
        if (this.parent.getFrozenColumns()) {
            content.querySelector('.e-movablecontent').style.overflowY = this.parent.height === 'auto' ? 'auto' : 'scroll';
        }
        else {
            content.style.overflowY = this.parent.height === 'auto' ? 'auto' : 'scroll';
        }
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        this.setPadding();
        this.oneTimeReady = true;
        if (this.parent.height === 'auto') {
            this.removePadding();
        }
        this.wireEvents();
        this.setHeight();
        this.setWidth();
    }
    /**
     * @hidden
     */
    destroy() {
        this.removeEventListener();
        //Remove padding
        this.removePadding();
        removeClass([this.parent.getHeaderContent().firstChild], 'e-headercontent');
        removeClass([this.parent.getContent().firstChild], 'e-content');
        //Remove height
        this.parent.getContent().firstChild.style.height = '';
        //Remove width
        this.parent.element.style.width = '';
        //Remove Dom event
        EventHandler.remove(this.parent.getContent().firstChild, 'scroll', this.onContentScroll);
    }
    /**
     * Function to get the scrollbar width of the browser.
     * @return {number}
     * @hidden
     */
    static getScrollBarWidth() {
        return getScrollBarWidth();
    }
}

/**
 *
 * The `Print` module is used to handle print action.
 */
class Print {
    /**
     * Constructor for the Grid print module
     * @hidden
     */
    constructor(parent, scrollModule) {
        this.isAsyncPrint = false;
        this.printing = 'isPrinting';
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(contentReady, this.contentReady.bind(this));
        this.parent.addEventListener(actionBegin, this.actionBegin.bind(this));
        this.parent.on(onEmpty, this.onEmpty.bind(this));
        this.scrollModule = scrollModule;
    }
    /**
     * By default, prints all the Grid pages and hides the pager.
     * > You can customize print options using the
     * [`printMode`](./api-grid.html#printmode-string).
     * @return {void}
     */
    print() {
        this.renderPrintGrid();
        this.printWind = window.open('', 'print', 'height=' + window.outerHeight + ',width=' + window.outerWidth + ',tabbar=no');
        this.printWind.moveTo(0, 0);
        this.printWind.resizeTo(screen.availWidth, screen.availHeight);
    }
    onEmpty() {
        if (this.isPrintGrid()) {
            this.contentReady();
        }
    }
    actionBegin() {
        if (this.isPrintGrid()) {
            this.isAsyncPrint = true;
        }
    }
    renderPrintGrid() {
        let gObj = this.parent;
        let printGridModel = {};
        let element = createElement('div', {
            id: this.parent.element.id + '_print', className: gObj.element.className + ' e-print-grid'
        });
        document.body.appendChild(element);
        for (let key of Print.printGridProp) {
            if (key === 'columns') {
                printGridModel[key] = getActualPropFromColl(gObj[key]);
            }
            else if (key === 'allowPaging') {
                printGridModel[key] = this.parent.printMode === 'CurrentPage';
            }
            else {
                printGridModel[key] = getActualProperties(gObj[key]);
            }
        }
        let printGrid = new Grid(printGridModel);
        printGrid.appendTo(element);
        printGrid[this.printing] = true;
    }
    contentReady() {
        if (this.isPrintGrid()) {
            let gObj = this.parent;
            if (this.isAsyncPrint) {
                this.printGrid();
                return;
            }
            let args = {
                requestType: 'print',
                element: gObj.element,
                selectedRows: gObj.getContentTable().querySelectorAll('tr[aria-selected="true"]'),
                cancel: false
            };
            if (!this.isAsyncPrint) {
                gObj.trigger(beforePrint, args);
            }
            if (args.cancel) {
                detach(gObj.element);
                return;
            }
            else if (!this.isAsyncPrint) {
                this.printGrid();
            }
        }
    }
    printGrid() {
        let gObj = this.parent;
        // Pager eleement process based on primt mode
        if (gObj.allowPaging && gObj.printMode === 'CurrentPage') {
            gObj.element.querySelector('.e-gridpager').style.display = 'none';
        }
        // Height adjustment on print grid
        if (gObj.height !== 'auto') {
            let cssProps = this.scrollModule.getCssProperties();
            let contentDiv = gObj.element.querySelector('.e-content');
            let headerDiv = gObj.element.querySelector('.e-gridheader');
            contentDiv.style.height = 'auto';
            contentDiv.style.overflowY = 'auto';
            headerDiv.style[cssProps.padding] = '';
            headerDiv.firstElementChild.style[cssProps.border] = '';
        }
        // Grid alignment adjustment on grouping
        if (gObj.allowGrouping) {
            if (!gObj.groupSettings.columns.length) {
                gObj.element.querySelector('.e-groupdroparea').style.display = 'none';
            }
            else {
                this.removeColGroup(gObj.groupSettings.columns.length, gObj.element);
                removeElement(gObj.element, '.e-grouptopleftcell');
                removeElement(gObj.element, '.e-recordpluscollapse');
                removeElement(gObj.element, '.e-indentcell');
                removeElement(gObj.element, '.e-recordplusexpand');
            }
        }
        // hide horizontal scroll
        gObj.element.querySelector('.e-content').style.overflowX = 'hidden';
        //hide filter bar in print grid
        if (gObj.allowFiltering && gObj.filterSettings.type === 'FilterBar') {
            gObj.element.querySelector('.e-filterbar').style.display = 'none';
        }
        // Hide the waiting popup
        let waitingPop = gObj.element.querySelectorAll('.e-spin-show');
        if (waitingPop.length > 0) {
            waitingPop[0].classList.add('e-spin-hide');
            waitingPop[0].classList.remove('e-spin-show');
        }
        if (gObj[this.printing]) {
            detach(gObj.element);
        }
        gObj.element.classList.remove('e-print-grid');
        this.printWind = print(gObj.element, this.printWind);
        gObj[this.printing] = false;
        let args = {
            element: gObj.element
        };
        gObj.trigger(printComplete, args);
    }
    removeColGroup(depth, element) {
        let groupCaption = element.querySelectorAll('.e-groupcaption');
        let colSpan = groupCaption[depth - 1].getAttribute('colspan');
        for (let i = 0; i < groupCaption.length; i++) {
            groupCaption[i].setAttribute('colspan', colSpan);
        }
        let colGroups = element.querySelectorAll('colgroup');
        for (let i = 0; i < colGroups.length; i++) {
            for (let j = 0; j < depth; j++) {
                colGroups[i].childNodes[j].style.display = 'none';
            }
        }
    }
    isPrintGrid() {
        return this.parent.element.id.indexOf('_print') > 0 && this.parent[this.printing];
    }
    /**
     * To destroy the print
     * @return {void}
     * @hidden
     */
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(contentReady, this.contentReady.bind(this));
        this.parent.removeEventListener(actionBegin, this.actionBegin.bind(this));
        this.parent.off(onEmpty, this.onEmpty.bind(this));
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'print';
    }
}
Print.printGridProp = [
    'aggregates', 'allowGrouping', 'allowFiltering', 'allowMultiSorting', 'allowReordering', 'allowSorting',
    'allowTextWrap', 'childGrid', 'columns', 'currentViewData', 'dataSource', 'detailTemplate', 'enableAltRow',
    'enableColumnVirtualization', 'filterSettings', 'gridLines',
    'groupSettings', 'height', 'locale', 'pageSettings', 'printMode', 'query', 'queryString',
    'rowHeight', 'rowTemplate', 'sortSettings', 'textWrapSettings', 'allowPaging',
    beforePrint, printComplete
];

var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Configures the Grid's aggregate column.
 */
class AggregateColumn extends ChildProperty {
    constructor() {
        super(...arguments);
        this.templateFn = {};
    }
    /**
     * @hidden
     */
    setFormatter() {
        let valueFormatter = new ValueFormatter();
        if (this.format && (this.format.skeleton || this.format.format)) {
            this.formatFn = valueFormatter.getFormatFunction(this.format);
        }
    }
    /**
     * @hidden
     */
    getFormatter() {
        return this.formatFn;
    }
    /**
     * @hidden
     */
    setTemplate(helper = {}) {
        if (this.footerTemplate !== undefined) {
            this.templateFn[getEnumValue(CellType, CellType.Summary)] = { fn: compile(this.footerTemplate, helper),
                property: 'footerTemplate' };
        }
        if (this.groupFooterTemplate !== undefined) {
            this.templateFn[getEnumValue(CellType, CellType.GroupSummary)] = { fn: compile(this.groupFooterTemplate, helper),
                property: 'groupFooterTemplate' };
        }
        if (this.groupCaptionTemplate !== undefined) {
            this.templateFn[getEnumValue(CellType, CellType.CaptionSummary)] = { fn: compile(this.groupCaptionTemplate, helper),
                property: 'groupCaptionTemplate' };
        }
    }
    /**
     * @hidden
     */
    getTemplate(type) {
        return this.templateFn[getEnumValue(CellType, type)];
    }
    /**
     * @hidden
     */
    setPropertiesSilent(prop) {
        this.setProperties(prop, true);
    }
}
__decorate$2([
    Property()
], AggregateColumn.prototype, "type", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "field", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "columnName", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "format", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "footerTemplate", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "groupFooterTemplate", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "groupCaptionTemplate", void 0);
__decorate$2([
    Property()
], AggregateColumn.prototype, "customAggregate", void 0);
/**
 * Configures the aggregate rows.
 */
class AggregateRow extends ChildProperty {
}
__decorate$2([
    Collection([], AggregateColumn)
], AggregateRow.prototype, "columns", void 0);

/**
 * The `Clipboard` module is used to handle clipboard copy action.
 */
class Clipboard {
    /**
     * Constructor for the Grid clipboard module
     * @hidden
     */
    constructor(parent) {
        this.copyContent = '';
        this.isSelect = false;
        this.parent = parent;
        this.addEventListener();
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(contentReady, this.initialEnd, this);
        this.parent.on(keyPressed, this.keyDownHandler, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(keyPressed, this.keyDownHandler);
    }
    initialEnd() {
        this.parent.off(contentReady, this.initialEnd);
        this.clipBoardTextArea = createElement('textarea', {
            className: 'e-clipboard',
            styles: 'opacity: 0',
            attrs: { readonly: 'true', tabindex: '-1', 'aria-label': 'clipboard' }
        });
        this.parent.element.appendChild(this.clipBoardTextArea);
    }
    keyDownHandler(e) {
        if (e.action === 'ctrlPlusC') {
            this.copy();
        }
        else if (e.action === 'ctrlShiftPlusH') {
            this.copy(true);
        }
    }
    setCopyData(withHeader) {
        if (window.getSelection().toString() === '') {
            let isFrozen = this.parent.getFrozenColumns();
            this.clipBoardTextArea.value = this.copyContent = '';
            let mRows;
            let rows = this.parent.getRows();
            if (isFrozen) {
                mRows = this.parent.getMovableDataRows();
            }
            if (this.parent.selectionSettings.mode !== 'Cell') {
                let selectedIndexes = this.parent.getSelectedRowIndexes().sort((a, b) => { return a - b; });
                if (withHeader) {
                    let headerTextArray = [];
                    for (let i = 0; i < this.parent.getVisibleColumns().length; i++) {
                        headerTextArray[i] = this.parent.getVisibleColumns()[i].headerText;
                    }
                    this.getCopyData(headerTextArray, false, '\t', withHeader);
                    this.copyContent += '\n';
                }
                for (let i = 0; i < selectedIndexes.length; i++) {
                    if (i > 0) {
                        this.copyContent += '\n';
                    }
                    let cells = [].slice.call(rows[selectedIndexes[i]].querySelectorAll('.e-rowcell'));
                    if (isFrozen) {
                        cells.push(...[].slice.call(mRows[selectedIndexes[i]].querySelectorAll('.e-rowcell')));
                    }
                    this.getCopyData(cells, false, '\t', withHeader);
                }
            }
            else {
                let obj = this.checkBoxSelection();
                if (obj.status) {
                    if (withHeader) {
                        let headers = [];
                        for (let i = 0; i < obj.colIndexes.length; i++) {
                            headers.push(this.parent.getColumnHeaderByIndex(obj.colIndexes[i]));
                        }
                        this.getCopyData(headers, false, '\t', withHeader);
                        this.copyContent += '\n';
                    }
                    for (let i = 0; i < obj.rowIndexes.length; i++) {
                        if (i > 0) {
                            this.copyContent += '\n';
                        }
                        let cells = [].slice.call(rows[obj.rowIndexes[i]].
                            querySelectorAll('.e-cellselectionbackground'));
                        if (isFrozen) {
                            cells.push(...[].slice.call(mRows[obj.rowIndexes[i]].querySelectorAll('.e-cellselectionbackground')));
                        }
                        this.getCopyData(cells, false, '\t', withHeader);
                    }
                }
                else {
                    this.getCopyData([].slice.call(this.parent.element.querySelectorAll('.e-cellselectionbackground')), true, '\n', withHeader);
                }
            }
            let args = {
                data: this.copyContent,
                cancel: false,
            };
            this.parent.trigger(beforeCopy, args);
            if (args.cancel) {
                return;
            }
            this.clipBoardTextArea.value = this.copyContent = args.data;
            if (!Browser.userAgent.match(/ipad|ipod|iphone/i)) {
                this.clipBoardTextArea.select();
            }
            else {
                this.clipBoardTextArea.setSelectionRange(0, this.clipBoardTextArea.value.length);
            }
            this.isSelect = true;
        }
    }
    getCopyData(cells, isCell, splitKey, withHeader) {
        let isElement = typeof cells[0] !== 'string';
        for (let j = 0; j < cells.length; j++) {
            if (withHeader && isCell) {
                this.copyContent += this.parent.getColumns()[parseInt(cells[j].getAttribute('aria-colindex'), 10)].headerText + '\n';
            }
            if (isElement) {
                if (!cells[j].classList.contains('e-hide')) {
                    this.copyContent += cells[j].textContent;
                }
            }
            else {
                this.copyContent += cells[j];
            }
            if (j < cells.length - 1) {
                this.copyContent += splitKey;
            }
        }
    }
    /**
     * Copy selected rows or cells data into clipboard.
     * @param {boolean} withHeader - Specifies whether the column header data need to be copied or not.
     */
    copy(withHeader) {
        if (document.queryCommandSupported('copy')) {
            this.setCopyData(withHeader);
            document.execCommand('copy');
            this.clipBoardTextArea.blur();
        }
        if (this.isSelect) {
            window.getSelection().removeAllRanges();
            this.isSelect = false;
        }
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'clipboard';
    }
    /**
     * To destroy the clipboard
     * @return {void}
     * @hidden
     */
    destroy() {
        this.removeEventListener();
        remove(this.clipBoardTextArea);
    }
    checkBoxSelection() {
        let gridObj = this.parent;
        let obj = { status: false };
        if (gridObj.selectionSettings.mode === 'Cell') {
            let rowCellIndxes = gridObj.getSelectedRowCellIndexes();
            let str;
            let rowIndexes = [];
            let i;
            for (i = 0; i < rowCellIndxes.length; i++) {
                if (rowCellIndxes[i].cellIndexes.length) {
                    rowIndexes.push(rowCellIndxes[i].rowIndex);
                }
                if (rowCellIndxes[i].cellIndexes.length) {
                    if (!str) {
                        str = JSON.stringify(rowCellIndxes[i].cellIndexes.sort());
                    }
                    if (str !== JSON.stringify(rowCellIndxes[i].cellIndexes.sort())) {
                        break;
                    }
                }
            }
            rowIndexes.sort();
            if (i === rowCellIndxes.length && rowIndexes[rowIndexes.length - 1] - rowIndexes[0] === rowIndexes.length - 1) {
                obj = { status: true, rowIndexes: rowIndexes, colIndexes: rowCellIndxes[0].cellIndexes };
            }
        }
        return obj;
    }
}

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Represents the field name and direction of sort column.
 */
class SortDescriptor extends ChildProperty {
}
__decorate([
    Property()
], SortDescriptor.prototype, "field", void 0);
__decorate([
    Property()
], SortDescriptor.prototype, "direction", void 0);
/**
 * Configures the sorting behavior of Grid.
 */
class SortSettings extends ChildProperty {
}
__decorate([
    Collection([], SortDescriptor)
], SortSettings.prototype, "columns", void 0);
__decorate([
    Property(true)
], SortSettings.prototype, "allowUnsort", void 0);
/**
 * Represents the predicate for the filter column.
 */
class Predicate$1 extends ChildProperty {
}
__decorate([
    Property()
], Predicate$1.prototype, "field", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "operator", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "value", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "matchCase", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "ignoreAccent", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "predicate", void 0);
__decorate([
    Property({})
], Predicate$1.prototype, "actualFilterValue", void 0);
__decorate([
    Property({})
], Predicate$1.prototype, "actualOperator", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "type", void 0);
__decorate([
    Property()
], Predicate$1.prototype, "ejpredicate", void 0);
/**
 * Configures the filtering behavior of the Grid.
 */
class FilterSettings extends ChildProperty {
}
__decorate([
    Collection([], Predicate$1)
], FilterSettings.prototype, "columns", void 0);
__decorate([
    Property('FilterBar')
], FilterSettings.prototype, "type", void 0);
__decorate([
    Property()
], FilterSettings.prototype, "mode", void 0);
__decorate([
    Property(true)
], FilterSettings.prototype, "showFilterBarStatus", void 0);
__decorate([
    Property(1500)
], FilterSettings.prototype, "immediateModeDelay", void 0);
__decorate([
    Property()
], FilterSettings.prototype, "operators", void 0);
__decorate([
    Property(false)
], FilterSettings.prototype, "ignoreAccent", void 0);
/**
 * Configures the selection behavior of the Grid.
 */
class SelectionSettings extends ChildProperty {
}
__decorate([
    Property('Row')
], SelectionSettings.prototype, "mode", void 0);
__decorate([
    Property('Flow')
], SelectionSettings.prototype, "cellSelectionMode", void 0);
__decorate([
    Property('Single')
], SelectionSettings.prototype, "type", void 0);
__decorate([
    Property(false)
], SelectionSettings.prototype, "checkboxOnly", void 0);
__decorate([
    Property(false)
], SelectionSettings.prototype, "persistSelection", void 0);
/**
 * Configures the search behavior of the Grid.
 */
class SearchSettings extends ChildProperty {
}
__decorate([
    Property([])
], SearchSettings.prototype, "fields", void 0);
__decorate([
    Property('')
], SearchSettings.prototype, "key", void 0);
__decorate([
    Property('contains')
], SearchSettings.prototype, "operator", void 0);
__decorate([
    Property(true)
], SearchSettings.prototype, "ignoreCase", void 0);
/**
 * Configures the row drop settings of the Grid.
 */
class RowDropSettings extends ChildProperty {
}
__decorate([
    Property()
], RowDropSettings.prototype, "targetID", void 0);
/**
 * Configures the text wrap settings of the Grid.
 */
class TextWrapSettings extends ChildProperty {
}
__decorate([
    Property('Both')
], TextWrapSettings.prototype, "wrapMode", void 0);
/**
 * Configures the group behavior of the Grid.
 */
class GroupSettings extends ChildProperty {
}
__decorate([
    Property(true)
], GroupSettings.prototype, "showDropArea", void 0);
__decorate([
    Property(false)
], GroupSettings.prototype, "showToggleButton", void 0);
__decorate([
    Property(false)
], GroupSettings.prototype, "showGroupedColumn", void 0);
__decorate([
    Property(true)
], GroupSettings.prototype, "showUngroupButton", void 0);
__decorate([
    Property(false)
], GroupSettings.prototype, "disablePageWiseAggregates", void 0);
__decorate([
    Property([])
], GroupSettings.prototype, "columns", void 0);
__decorate([
    Property()
], GroupSettings.prototype, "captionTemplate", void 0);
/**
 * Configures the edit behavior of the Grid.
 */
class EditSettings extends ChildProperty {
}
__decorate([
    Property(false)
], EditSettings.prototype, "allowAdding", void 0);
__decorate([
    Property(false)
], EditSettings.prototype, "allowEditing", void 0);
__decorate([
    Property(false)
], EditSettings.prototype, "allowDeleting", void 0);
__decorate([
    Property('Normal')
], EditSettings.prototype, "mode", void 0);
__decorate([
    Property(true)
], EditSettings.prototype, "allowEditOnDblClick", void 0);
__decorate([
    Property(true)
], EditSettings.prototype, "showConfirmDialog", void 0);
__decorate([
    Property(false)
], EditSettings.prototype, "showDeleteConfirmDialog", void 0);
/**
 * Represents the Grid component.
 * ```html
 * <div id="grid"></div>
 * <script>
 *  var gridObj = new Grid({ allowPaging: true });
 *  gridObj.appendTo("#grid");
 * </script>
 * ```
 */
let Grid = class Grid extends Component {
    /**
     * Constructor for creating the component
     * @hidden
     */
    constructor(options, element) {
        super(options, element);
        this.freezeRefresh = Component.prototype.refresh;
        this.needsID = true;
        setValue('mergePersistData', this.mergePersistGridData, this);
    }
    /**
     * Get the properties to be maintained in the persisted state.
     * @return {string}
     * @hidden
     */
    getPersistData() {
        let keyEntity = ['pageSettings', 'sortSettings',
            'filterSettings', 'groupSettings', 'columns', 'searchSettings', 'selectedRowIndex'];
        let ignoreOnPersist = {
            pageSettings: ['template', 'pageSizes', 'enableQueryString', 'totalRecordsCount', 'pageCount'],
            filterSettings: ['type', 'mode', 'showFilterBarStatus', 'immediateModeDelay', 'ignoreAccent'],
            groupSettings: ['showDropArea', 'showToggleButton', 'showGroupedColumn', 'showUngroupButton',
                'disablePageWiseAggregates', 'hideCaptionCount'],
            searchSettings: ['fields', 'operator', 'ignoreCase'],
            sortSettings: [], columns: [], selectedRowIndex: []
        };
        let ignoreOnColumn = ['filter', 'edit', 'filterBarTemplate', 'headerTemplate', 'template',
            'commandTemplate', 'commands', 'format', 'dataSource'];
        keyEntity.forEach((value) => {
            let currentObject = this[value];
            for (let val of ignoreOnPersist[value]) {
                delete currentObject[val];
            }
        });
        this.ignoreInArrays(ignoreOnColumn, this.columns);
        return this.addOnPersist(keyEntity);
    }
    ignoreInArrays(ignoreOnColumn, columns) {
        columns.forEach((column) => {
            if (column.columns) {
                this.ignoreInColumn(ignoreOnColumn, column);
                this.ignoreInArrays(ignoreOnColumn, column.columns);
            }
            else {
                this.ignoreInColumn(ignoreOnColumn, column);
            }
        });
    }
    ignoreInColumn(ignoreOnColumn, column) {
        ignoreOnColumn.forEach((val) => {
            delete column[val];
        });
    }
    /**
     * To provide the array of modules needed for component rendering
     * @return {ModuleDeclaration[]}
     * @hidden
     */
    requiredModules() {
        let modules = [];
        if (this.allowFiltering) {
            modules.push({
                member: 'filter',
                args: [this, this.filterSettings, this.serviceLocator]
            });
        }
        if (this.allowExcelExport) {
            modules.push({
                member: 'ExcelExport',
                args: [this]
            });
        }
        if (this.allowPdfExport) {
            modules.push({
                member: 'PdfExport',
                args: [this]
            });
        }
        if (this.allowSorting) {
            modules.push({
                member: 'sort',
                args: [this, this.sortSettings, this.sortedColumns, this.serviceLocator]
            });
        }
        if (this.allowPaging) {
            modules.push({
                member: 'pager',
                args: [this, this.pageSettings]
            });
        }
        if (this.allowSelection) {
            modules.push({
                member: 'selection',
                args: [this, this.selectionSettings, this.serviceLocator]
            });
        }
        modules.push({
            member: 'resize',
            args: [this]
        });
        if (this.allowReordering) {
            modules.push({
                member: 'reorder',
                args: [this]
            });
        }
        if (this.allowRowDragAndDrop) {
            modules.push({
                member: 'rowDragAndDrop',
                args: [this]
            });
        }
        if (this.allowGrouping) {
            modules.push({
                member: 'group',
                args: [this, this.groupSettings, this.sortedColumns, this.serviceLocator]
            });
        }
        if (this.aggregates.length) {
            modules.push({ member: 'aggregate', args: [this, this.serviceLocator] });
        }
        if (this.isDetail()) {
            modules.push({
                member: 'detailRow',
                args: [this, this.serviceLocator]
            });
        }
        if (this.toolbar || this.toolbarTemplate) {
            modules.push({
                member: 'toolbar',
                args: [this, this.serviceLocator]
            });
        }
        if (this.enableVirtualization || this.enableColumnVirtualization) {
            modules.push({
                member: 'virtualscroll',
                args: [this, this.serviceLocator]
            });
        }
        if (this.getFrozenColumns() || this.frozenRows) {
            modules.push({ member: 'freeze', args: [this, this.serviceLocator] });
        }
        if (this.isCommandColumn(this.columns)) {
            modules.push({
                member: 'commandColumn',
                args: [this, this.serviceLocator]
            });
        }
        if (this.editSettings.allowAdding || this.editSettings.allowDeleting || this.editSettings.allowEditing) {
            modules.push({
                member: 'edit',
                args: [this, this.serviceLocator]
            });
        }
        this.extendRequiredModules(modules);
        return modules;
    }
    extendRequiredModules(modules) {
        if (this.contextMenuItems) {
            modules.push({
                member: 'contextMenu',
                args: [this, this.serviceLocator]
            });
        }
        if (this.showColumnMenu) {
            modules.push({
                member: 'columnMenu',
                args: [this, this.serviceLocator]
            });
        }
        if (this.showColumnChooser) {
            modules.push({
                member: 'columnChooser',
                args: [this, this.serviceLocator]
            });
        }
        if (this.isForeignKeyEnabled(this.columns)) {
            modules.push({ member: 'foreignKey', args: [this, this.serviceLocator] });
        }
    }
    /**
     * For internal use only - Initialize the event handler;
     * @private
     */
    preRender() {
        this.serviceLocator = new ServiceLocator;
        this.initProperties();
        this.initializeServices();
    }
    initProperties() {
        /* tslint:disable */
        this.isInitial = true;
        this.sortedColumns = [];
        this.inViewIndexes = [];
        this.mediaCol = [];
        this.isMediaQuery = false;
        this.isInitialLoad = false;
        this.mergeCells = {};
        this.isEdit = false;
        this.checkAllRows = 'None';
        this.isCheckBoxSelection = false;
        this.isPersistSelection = false;
        this.freezeRefresh = Component.prototype.refresh;
        this.filterOperators = {
            contains: 'contains', endsWith: 'endswith', equal: 'equal', greaterThan: 'greaterthan', greaterThanOrEqual: 'greaterthanorequal',
            lessThan: 'lessthan', lessThanOrEqual: 'lessthanorequal', notEqual: 'notequal', startsWith: 'startswith'
        };
        this.defaultLocale = {
            EmptyRecord: 'No records to display',
            True: 'true',
            False: 'false',
            InvalidFilterMessage: 'Invalid Filter Data',
            GroupDropArea: 'Drag a column header here to group its column',
            UnGroup: 'Click here to ungroup',
            GroupDisable: 'Grouping is disabled for this column',
            FilterbarTitle: '\'s filter bar cell',
            EmptyDataSourceError: 'DataSource must not be empty at initial load since columns are generated from dataSource in AutoGenerate Column Grid',
            // Toolbar Items
            Add: 'Add',
            Edit: 'Edit',
            Cancel: 'Cancel',
            Update: 'Update',
            Delete: 'Delete',
            Print: 'Print',
            Pdfexport: 'PDF Export',
            Excelexport: 'Excel Export',
            Wordexport: 'Word Export',
            Csvexport: 'CSV Export',
            Search: 'Search',
            Columnchooser: 'Columns',
            Save: 'Save',
            Item: 'item',
            Items: 'items',
            EditOperationAlert: 'No records selected for edit operation',
            DeleteOperationAlert: 'No records selected for delete operation',
            SaveButton: 'Save',
            OKButton: 'OK',
            CancelButton: 'Cancel',
            EditFormTitle: 'Details of ',
            AddFormTitle: 'Add New Record',
            BatchSaveConfirm: 'Are you sure you want to save changes?',
            BatchSaveLostChanges: 'Unsaved changes will be lost. Are you sure you want to continue?',
            ConfirmDelete: 'Are you sure you want to Delete Record?',
            CancelEdit: 'Are you sure you want to Cancel the changes?',
            ChooseColumns: 'Choose Column',
            SearchColumns: 'search columns',
            Matchs: 'No Matches Found',
            FilterButton: 'Filter',
            ClearButton: 'Clear',
            StartsWith: 'Starts With',
            EndsWith: 'Ends With',
            Contains: 'Contains',
            Equal: 'Equal',
            NotEqual: 'Not Equal',
            LessThan: 'Less Than',
            LessThanOrEqual: 'Less Than Or Equal',
            GreaterThan: 'Greater Than',
            GreaterThanOrEqual: 'Greater Than Or Equal',
            ChooseDate: 'Choose a Date',
            EnterValue: 'Enter the value',
            Copy: 'Copy',
            Group: 'Group by this column',
            Ungroup: 'Ungroup by this column',
            autoFitAll: 'Auto Fit all columns',
            autoFit: 'Auto Fit this column',
            Export: 'Export',
            FirstPage: 'First Page',
            LastPage: 'Last Page',
            PreviousPage: 'Previous Page',
            NextPage: 'Next Page',
            SortAscending: 'Sort Ascending',
            SortDescending: 'Sort Descending',
            EditRecord: 'Edit Record',
            DeleteRecord: 'Delete Record',
            FilterMenu: 'Filter'
        };
        this.keyConfigs = {
            downArrow: 'downarrow',
            upArrow: 'uparrow',
            rightArrow: 'rightarrow',
            leftArrow: 'leftarrow',
            shiftDown: 'shift+downarrow',
            shiftUp: 'shift+uparrow',
            shiftRight: 'shift+rightarrow',
            shiftLeft: 'shift+leftarrow',
            home: 'home',
            end: 'end',
            escape: 'escape',
            ctrlHome: 'ctrl+home',
            ctrlEnd: 'ctrl+end',
            pageUp: 'pageup',
            pageDown: 'pagedown',
            ctrlAltPageUp: 'ctrl+alt+pageup',
            ctrlAltPageDown: 'ctrl+alt+pagedown',
            altPageUp: 'alt+pageup',
            altPageDown: 'alt+pagedown',
            altDownArrow: 'alt+downarrow',
            altUpArrow: 'alt+uparrow',
            ctrlDownArrow: 'ctrl+downarrow',
            ctrlUpArrow: 'ctrl+uparrow',
            ctrlPlusA: 'ctrl+A',
            ctrlPlusP: 'ctrl+P',
            insert: 'insert',
            delete: 'delete',
            f2: 'f2',
            enter: 'enter',
            ctrlEnter: 'ctrl+enter',
            shiftEnter: 'shift+enter',
            tab: 'tab',
            shiftTab: 'shift+tab',
            space: 'space',
            ctrlPlusC: 'ctrl+C',
            ctrlShiftPlusH: 'ctrl+shift+H'
        };
        /* tslint:enable */
    }
    /**
     * For internal use only - To Initialize the component rendering.
     * @private
     */
    render() {
        this.ariaService.setOptions(this.element, { role: 'grid' });
        createSpinner({ target: this.element });
        this.renderModule = new Render(this, this.serviceLocator);
        this.getMediaColumns();
        this.searchModule = new Search(this);
        this.scrollModule = new Scroll(this);
        this.notify(initialLoad, {});
        this.trigger(load);
        prepareColumns(this.columns, this.enableColumnVirtualization);
        this.getColumns();
        this.processModel();
        this.gridRender();
        this.wireEvents();
        this.addListener();
        this.updateDefaultCursor();
        this.updateStackedFilter();
        this.showSpinner();
        this.notify(initialEnd, {});
    }
    /**
     * By default, grid shows the spinner for all its actions. You can use this method to show spinner at your needed time.
     */
    showSpinner() {
        showSpinner(this.element);
    }
    /**
     * Manually showed spinner needs to hide by `hideSpinnner`.
     */
    hideSpinner() {
        hideSpinner(this.element);
    }
    updateStackedFilter() {
        if (this.allowFiltering && this.filterSettings.type === 'FilterBar' &&
            this.getHeaderContent().querySelectorAll('.e-stackedheadercell').length) {
            this.getHeaderContent().classList.add('e-stackedfilter');
        }
        else {
            this.getHeaderContent().classList.remove('e-stackedfilter');
        }
    }
    getMediaColumns() {
        if (!this.enableColumnVirtualization) {
            let gcol = this.getColumns();
            this.getShowHideService = this.serviceLocator.getService('showHideService');
            if (!isNullOrUndefined(gcol)) {
                for (let index = 0; index < gcol.length; index++) {
                    if (!isNullOrUndefined(gcol[index].hideAtMedia)) {
                        this.mediaCol.push(gcol[index]);
                        let media = window.matchMedia(gcol[index].hideAtMedia);
                        this.mediaQueryUpdate(index, media);
                        media.addListener(this.mediaQueryUpdate.bind(this, index));
                    }
                }
            }
        }
    }
    /**
     * @hidden
     */
    mediaQueryUpdate(columnIndex, e) {
        this.isMediaQuery = true;
        let col = this.getColumns()[columnIndex];
        col.visible = e.matches;
        if (this.isInitialLoad) {
            if (col.visible) {
                this.showHider.show(col.headerText, 'headerText');
            }
            else {
                this.showHider.hide(col.headerText, 'headerText');
            }
        }
    }
    refreshMediaCol() {
        if (this.isMediaQuery) {
            this.refresh();
            this.isMediaQuery = false;
        }
        this.isInitialLoad = true;
    }
    /**
     * For internal use only - Initialize the event handler
     * @private
     */
    eventInitializer() {
        //eventInitializer
    }
    /**
     * Destroys the component (detaches/removes all event handlers, attributes, classes, and empties the component element).
     * @method destroy
     * @return {void}
     */
    destroy() {
        this.unwireEvents();
        this.removeListener();
        this.notify(destroy, {});
        this.destroyDependentModules();
        super.destroy();
        this.element.innerHTML = '';
        classList(this.element, [], ['e-rtl', 'e-gridhover', 'e-responsive', 'e-default', 'e-device', 'e-grid-min-height']);
    }
    destroyDependentModules() {
        this.scrollModule.destroy();
        this.keyboardModule.destroy();
        this.focusModule.destroy();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'grid';
    }
    /**
     * Called internally if any of the property value changed.
     * @hidden
     */
    onPropertyChanged(newProp, oldProp) {
        let requireRefresh = false;
        let requireGridRefresh = false;
        let checkCursor;
        let args = { requestType: 'refresh' };
        if (this.isDestroyed) {
            return;
        }
        for (let prop of Object.keys(newProp)) {
            switch (prop) {
                case 'allowPaging':
                    this.notify(uiUpdate, { module: 'pager', enable: this.allowPaging });
                    requireRefresh = true;
                    break;
                case 'pageSettings':
                    this.notify(inBoundModelChanged, { module: 'pager', properties: newProp.pageSettings });
                    if (isNullOrUndefined(newProp.pageSettings.currentPage) && isNullOrUndefined(newProp.pageSettings.totalRecordsCount)) {
                        requireRefresh = true;
                    }
                    break;
                case 'currencyCode':
                case 'locale':
                    super.refresh();
                    break;
                case 'allowSorting':
                    this.notify(uiUpdate, { module: 'sort', enable: this.allowSorting });
                    requireRefresh = true;
                    checkCursor = true;
                    break;
                case 'allowFiltering':
                    this.updateStackedFilter();
                    this.notify(uiUpdate, { module: 'filter', enable: this.allowFiltering });
                    requireRefresh = true;
                    if (this.filterSettings.type !== 'FilterBar') {
                        this.refreshHeader();
                    }
                    break;
                case 'height':
                case 'width':
                    this.notify(uiUpdate, { module: 'scroll', properties: { width: newProp.width, height: newProp.height } });
                    break;
                case 'allowReordering':
                    this.headerModule.refreshUI();
                    checkCursor = true;
                    break;
                case 'allowRowDragAndDrop':
                    this.notify(uiUpdate, { module: 'rowDragAndDrop', enable: this.allowRowDragAndDrop });
                    break;
                case 'rowTemplate':
                    this.rowTemplateFn = templateCompiler(this.rowTemplate);
                    requireRefresh = true;
                    break;
                case 'detailTemplate':
                    this.detailTemplateFn = templateCompiler(this.detailTemplate);
                    requireRefresh = true;
                    break;
                case 'allowGrouping':
                    this.notify(uiUpdate, { module: 'group', enable: this.allowGrouping });
                    this.headerModule.refreshUI();
                    requireRefresh = true;
                    checkCursor = true;
                    break;
                case 'childGrid':
                    requireRefresh = true;
                    break;
                case 'toolbar':
                    this.notify(uiUpdate, { module: 'toolbar' });
                    break;
                case 'groupSettings':
                    if (!(isNullOrUndefined(newProp.groupSettings.showDropArea))) {
                        this.headerModule.refreshUI();
                        requireRefresh = true;
                        checkCursor = true;
                    }
                    this.notify(inBoundModelChanged, { module: 'group', properties: newProp.groupSettings,
                        oldProperties: oldProp.groupSettings });
                    break;
                case 'aggregates':
                    this.notify(uiUpdate, { module: 'aggregate', properties: newProp });
                    break;
                case 'columns':
                    this.updateColumnObject();
                    requireGridRefresh = true;
                    break;
                case 'frozenColumns':
                case 'frozenRows':
                    this.freezeRefresh();
                    break;
                default:
                    this.extendedPropertyChange(prop, newProp);
            }
        }
        if (checkCursor) {
            this.updateDefaultCursor();
        }
        if (requireGridRefresh) {
            this.refresh();
        }
        else if (requireRefresh) {
            this.notify(modelChanged, args);
            requireRefresh = false;
        }
    }
    extendedPropertyChange(prop, newProp) {
        switch (prop) {
            case 'enableRtl':
                this.updateRTL();
                if (this.allowPaging) {
                    this.element.querySelector('.e-gridpager').ej2_instances[0].enableRtl = newProp.enableRtl;
                    this.element.querySelector('.e-gridpager').ej2_instances[0].dataBind();
                }
                if (this.height !== 'auto') {
                    this.scrollModule.removePadding(!newProp.enableRtl);
                    this.scrollModule.setPadding();
                }
                if (this.toolbar) {
                    this.toolbarModule.getToolbar().ej2_instances[0].enableRtl = newProp.enableRtl;
                    this.toolbarModule.getToolbar().ej2_instances[0].dataBind();
                }
                if (this.contextMenuItems) {
                    this.contextMenuModule.getContextMenu().ej2_instances[0].enableRtl = newProp.enableRtl;
                    this.contextMenuModule.getContextMenu().ej2_instances[0].dataBind();
                }
                if (this.showColumnMenu) {
                    this.columnMenuModule.getColumnMenu().ej2_instances[0].enableRtl = newProp.enableRtl;
                    this.columnMenuModule.getColumnMenu().ej2_instances[0].dataBind();
                }
                this.notify(rtlUpdated, {});
                break;
            case 'enableAltRow':
                this.renderModule.refresh();
                break;
            case 'allowResizing':
                this.headerModule.refreshUI();
                this.updateResizeLines();
                break;
            case 'rowHeight':
                if (this.rowHeight) {
                    addClass([this.element], 'e-grid-min-height');
                }
                else {
                    removeClass([this.element], 'e-grid-min-height');
                }
                this.renderModule.refresh();
                this.headerModule.refreshUI();
                break;
            case 'gridLines':
                this.updateGridLines();
                break;
            case 'showColumnMenu':
                this.headerModule.refreshUI();
                this.notify(uiUpdate, { module: 'columnMenu', enable: true });
                break;
            case 'columnMenuItems':
                this.notify(uiUpdate, { module: 'columnMenu', enable: this.columnMenuItems });
                break;
            case 'contextMenuItems':
                this.notify(uiUpdate, { module: 'contextMenu', enable: this.contextMenuItems });
                break;
            case 'showColumnChooser':
                this.notify(uiUpdate, { module: 'columnChooser', enable: this.showColumnChooser });
                break;
            case 'filterSettings':
                this.updateStackedFilter();
                this.notify(inBoundModelChanged, { module: 'filter', properties: newProp.filterSettings });
                break;
            case 'searchSettings':
                this.notify(inBoundModelChanged, { module: 'search', properties: newProp.searchSettings });
                break;
            case 'sortSettings':
                this.notify(inBoundModelChanged, { module: 'sort' });
                break;
            case 'selectionSettings':
                this.notify(inBoundModelChanged, { module: 'selection', properties: newProp.selectionSettings });
                break;
            case 'editSettings':
                this.notify(inBoundModelChanged, { module: 'edit', properties: newProp.editSettings });
                break;
            case 'allowTextWrap':
            case 'textWrapSettings':
                if (this.allowTextWrap) {
                    this.applyTextWrap();
                }
                else {
                    this.removeTextWrap();
                }
                this.notify(freezeRender, { case: 'textwrap', isModeChg: (prop === 'textWrapSettings') });
                break;
            case 'dataSource':
                let pending = this.getDataModule().getState();
                if (pending.isPending) {
                    let gResult = !isNullOrUndefined(this.dataSource) ? this.dataSource.result : [];
                    (pending.group || []).forEach((name) => { gResult = DataUtil.group(gResult, name); });
                    this.dataSource = { result: gResult, count: this.dataSource.count };
                    pending.resolver(this.dataSource);
                }
                else {
                    this.notify(dataSourceModified, {});
                    this.renderModule.refresh();
                }
                break;
            case 'enableHover':
                let action = newProp.enableHover ? addClass : removeClass;
                action([this.element], 'e-gridhover');
                break;
        }
    }
    updateDefaultCursor() {
        let headerRows = [].slice.call(this.element.querySelectorAll('.e-columnheader'));
        for (let row of headerRows) {
            if (this.allowSorting || this.allowGrouping || this.allowReordering) {
                row.classList.remove('e-defaultcursor');
            }
            else {
                row.classList.add('e-defaultcursor');
            }
        }
    }
    updateColumnModel(columns) {
        for (let i = 0, len = columns.length; i < len; i++) {
            if (columns[i].columns) {
                this.updateColumnModel(columns[i].columns);
            }
            else {
                this.columnModel.push(columns[i]);
            }
        }
        this.updateFrozenColumns();
    }
    updateFrozenColumns() {
        let cols = this.columnModel;
        let count = 0;
        for (let i = 0, len = cols.length; i < len; i++) {
            if (cols[i].isFrozen) {
                cols.splice(this.frozenColumns + count, 0, cols.splice(i, 1)[0]);
                count++;
            }
        }
    }
    /**
     * Gets the columns from the Grid.
     * @return {Column[]}
     */
    getColumns(isRefresh) {
        let inview = this.inViewIndexes.map((v) => v - this.groupSettings.columns.length).filter((v) => v > -1);
        let vLen = inview.length;
        if (!this.enableColumnVirtualization || isNullOrUndefined(this.columnModel) || this.columnModel.length === 0 || isRefresh) {
            this.columnModel = [];
            this.updateColumnModel(this.columns);
        }
        let columns = vLen === 0 ? this.columnModel :
            this.columnModel.slice(inview[0], inview[vLen - 1] + 1);
        return columns;
    }
    /**
     * @private
     */
    getColumnIndexesInView() {
        return this.inViewIndexes;
    }
    /**
     * @private
     */
    getLocaleConstants() {
        return this.defaultLocale;
    }
    /**
     * @private
     */
    setColumnIndexesInView(indexes) {
        this.inViewIndexes = indexes;
    }
    /**
     * Gets the visible columns from the Grid.
     * @return {Column[]}
     */
    getVisibleColumns() {
        let cols = [];
        for (let col of this.columnModel) {
            if (col.visible) {
                cols.push(col);
            }
        }
        return cols;
    }
    /**
     * Gets the header div of the Grid.
     * @return {Element}
     */
    getHeaderContent() {
        return this.headerModule.getPanel();
    }
    /**
     * Sets the header div of the Grid to replace the old header.
     * @param  {Element} element - Specifies the Grid header.
     * @return {void}
     */
    setGridHeaderContent(element) {
        this.headerModule.setPanel(element);
    }
    /**
     * Gets the content table of the Grid.
     * @return {Element}
     */
    getContentTable() {
        return this.contentModule.getTable();
    }
    /**
     * Sets the content table of the Grid to replace the old content table.
     * @param  {Element} element - Specifies the Grid content table.
     * @return {void}
     */
    setGridContentTable(element) {
        this.contentModule.setTable(element);
    }
    /**
     * Gets the content div of the Grid.
     * @return {Element}
     */
    getContent() {
        return this.contentModule.getPanel();
    }
    /**
     * Sets the content div of the Grid to replace the old Grid content.
     * @param  {Element} element - Specifies the Grid content.
     * @return {void}
     */
    setGridContent(element) {
        this.contentModule.setPanel(element);
    }
    /**
     * Gets the header table element of the Grid.
     * @return {Element}
     */
    getHeaderTable() {
        return this.headerModule.getTable();
    }
    /**
     * Sets the header table of the Grid to replace the old one.
     * @param  {Element} element - Specifies the Grid header table.
     * @return {void}
     */
    setGridHeaderTable(element) {
        this.headerModule.setTable(element);
    }
    /**
     * Gets the footer div of the Grid.
     * @return {Element}
     */
    getFooterContent() {
        if (isNullOrUndefined(this.footerElement)) {
            this.footerElement = this.element.getElementsByClassName('e-gridfooter')[0];
        }
        return this.footerElement;
    }
    /**
     * Gets the footer table element of the Grid.
     * @return {Element}
     */
    getFooterContentTable() {
        if (isNullOrUndefined(this.footerElement)) {
            this.footerElement = this.element.getElementsByClassName('e-gridfooter')[0];
        }
        return this.footerElement.firstChild.firstChild;
    }
    /**
     * Gets the pager of the Grid.
     * @return {Element}
     */
    getPager() {
        return this.gridPager; //get element from pager
    }
    /**
     * Sets the pager of the Grid to replace the old pager.
     * @param  {Element} element - Specifies the Grid pager.
     * @return {void}
     */
    setGridPager(element) {
        this.gridPager = element;
    }
    /**
     * Gets a row by index.
     * @param  {number} index - Specifies the row index.
     * @return {Element}
     */
    getRowByIndex(index) {
        return this.contentModule.getRowByIndex(index);
    }
    /**
     * Gets a movable tables row by index.
     * @param  {number} index - Specifies the row index.
     * @return {Element}
     */
    getMovableRowByIndex(index) {
        return this.contentModule.getMovableRowByIndex(index);
    }
    /**
     * Gets all the data rows of the Grid.
     * @return {Element[]}
     */
    getRows() {
        return this.contentModule.getRowElements();
    }
    /**
     * Get a row information based on cell
     * @param {Element}
     * @return RowInfo
     */
    getRowInfo(target) {
        let ele = target;
        let args = { target: target };
        if (!isNullOrUndefined(target) && isNullOrUndefined(parentsUntil(ele, 'e-detailrowcollapse')
            && isNullOrUndefined(parentsUntil(ele, 'e-recordplusexpand'))) && !this.isEdit) {
            let cell = closest(ele, '.e-rowcell');
            if (!cell) {
                return args;
            }
            let cellIndex = parseInt(cell.getAttribute('aria-colindex'), 10);
            if (!isNullOrUndefined(cell) && !isNaN(cellIndex)) {
                let row = closest(cell, '.e-row');
                let rowIndex = parseInt(row.getAttribute('aria-rowindex'), 10);
                let frzCols = this.getFrozenColumns();
                let isMovable = frzCols ? cellIndex >= frzCols : false;
                let rows = (isMovable ?
                    this.contentModule.getMovableRows() : this.contentModule.getRows());
                let rowsObject = rows.filter((r) => r.uid === row.getAttribute('data-uid'));
                let rowData = rowsObject[0].data;
                let column = rowsObject[0].cells[isMovable ? cellIndex - frzCols : cellIndex].column;
                args = { cell: cell, cellIndex: cellIndex, row: row, rowIndex: rowIndex, rowData: rowData, column: column, target: target };
            }
        }
        return args;
    }
    /**
     * Gets the Grid's movable content rows from frozen grid.
     * @return {Element[]}
     */
    getMovableRows() {
        return this.contentModule.getMovableRowElements();
    }
    /**
     * Gets all the Grid's data rows.
     * @return {Element[]}
     */
    getDataRows() {
        let rows = [].slice.call(this.getContentTable().querySelector('tbody').children);
        if (this.frozenRows) {
            let freezeRows = [].slice.call(this.getHeaderTable().querySelector('tbody').children);
            rows = this.addMovableRows(freezeRows, rows);
        }
        let dataRows = this.generateDataRows(rows);
        return dataRows;
    }
    /**
     * @hidden
     */
    addMovableRows(fRows, mrows) {
        for (let i = 0, len = mrows.length; i < len; i++) {
            fRows.push(mrows[i]);
        }
        return fRows;
    }
    generateDataRows(rows) {
        let dRows = [];
        for (let i = 0, len = rows.length; i < len; i++) {
            if (rows[i].classList.contains('e-row') && !rows[i].classList.contains('e-hiddenrow')) {
                dRows.push(rows[i]);
            }
        }
        return dRows;
    }
    /**
     * Gets all the Grid's movable table data rows.
     * @return {Element[]}
     */
    getMovableDataRows() {
        let rows = [].slice.call(this.getContent().querySelector('.e-movablecontent').querySelector('tbody').children);
        if (this.frozenRows) {
            let freezeRows = [].slice.call(this.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody').children);
            rows = this.addMovableRows(freezeRows, rows);
        }
        let dataRows = this.generateDataRows(rows);
        return dataRows;
    }
    /**
     * Updates particular cell value based on the given primary key value.
     * > Primary key column must be specified using `columns.isPrimaryKey` property.
     * @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     * @param {string } field - Specifies the field name which you want to update.
     * @param {string | number | boolean | Date} value - To update new value for the particular cell.
     */
    setCellValue(key, field, value) {
        let cells = 'cells';
        let rowData = 'data';
        let rowuID = 'uid';
        let fieldIdx;
        let col;
        let tr;
        let pkName = this.getPrimaryKeyFieldNames()[0];
        let cell = new CellRenderer(this, this.serviceLocator);
        let selectedRow = {};
        let rowObjects = this.contentModule.getRows();
        fieldIdx = this.getColumnIndexByField(field);
        col = this.getColumnByField(field);
        selectedRow = rowObjects.filter((r) => getValue(pkName, r.data) === key)[0];
        tr = !isNullOrUndefined(selectedRow) ? this.element.querySelector('[data-uid=' + selectedRow[rowuID] + ']') : null;
        if (!isNullOrUndefined(tr)) {
            setValue(field, value, selectedRow[rowData]);
            let td = tr.childNodes[fieldIdx];
            if (!isNullOrUndefined(td)) {
                cell.refreshTD(td, selectedRow[cells][fieldIdx], selectedRow[rowData]);
                this.trigger(queryCellInfo, {
                    cell: td, column: col, data: selectedRow[rowData]
                });
            }
        }
        else {
            return;
        }
    }
    /**
     * Updates and refresh the particular row values based on the given primary key value.
     * > Primary key column must be specified using `columns.isPrimaryKey` property.
     *  @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     *  @param {Object} rowData - To update new data for the particular row.
     */
    setRowData(key, rowData) {
        let rowuID = 'uid';
        let rowObjects = this.contentModule.getRows();
        let selectedRow;
        let pkName = this.getPrimaryKeyFieldNames()[0];
        let rowRenderer = new RowRenderer(this.serviceLocator, null, this);
        selectedRow = rowObjects.filter((r) => getValue(pkName, r.data) === key)[0];
        if (!isNullOrUndefined(selectedRow) && this.element.querySelectorAll('[data-uid=' + selectedRow[rowuID] + ']').length) {
            selectedRow.changes = rowData;
            refreshForeignData(selectedRow, this.getForeignKeyColumns(), selectedRow.changes);
            rowRenderer.refresh(selectedRow, this.getColumns(), true);
        }
        else {
            return;
        }
    }
    /**
     * Gets a cell by row and column index.
     * @param  {number} rowIndex - Specifies the row index.
     * @param  {number} columnIndex - Specifies the column index.
     * @return {Element}
     */
    getCellFromIndex(rowIndex, columnIndex) {
        return this.getDataRows()[rowIndex].querySelectorAll('.e-rowcell')[columnIndex];
    }
    /**
     * Gets a movable table cell by row and column index.
     * @param  {number} rowIndex - Specifies the row index.
     * @param  {number} columnIndex - Specifies the column index.
     * @return {Element}
     */
    getMovableCellFromIndex(rowIndex, columnIndex) {
        return this.getMovableDataRows()[rowIndex].querySelectorAll('.e-rowcell')[columnIndex - this.getFrozenColumns()];
    }
    /**
     * Gets a column header by column index.
     * @param  {number} index - Specifies the column index.
     * @return {Element}
     */
    getColumnHeaderByIndex(index) {
        return this.getHeaderTable().querySelectorAll('.e-headercell')[index];
    }
    /**
     * @hidden
     */
    getRowObjectFromUID(uid) {
        let rows = this.contentModule.getRows();
        let row = this.rowObject(rows, uid);
        if (this.getFrozenColumns()) {
            if (!row) {
                row = this.rowObject(this.contentModule.getMovableRows(), uid);
                return row;
            }
        }
        return row;
    }
    rowObject(rows, uid) {
        for (let row of rows) {
            if (row.uid === uid) {
                return row;
            }
        }
        return null;
    }
    /**
     * @hidden
     */
    getRowsObject() {
        return this.contentModule.getRows();
    }
    /**
     * @hidden
     */
    getMovableRowsObject() {
        return this.contentModule.getMovableRows();
    }
    /**
     * Gets a column header by column name.
     * @param  {string} field - Specifies the column name.
     * @return {Element}
     */
    getColumnHeaderByField(field) {
        return this.getColumnHeaderByUid(this.getColumnByField(field).uid);
    }
    /**
     * Gets a column header by UID.
     * @param  {string} field - Specifies the column uid.
     * @return {Element}
     */
    getColumnHeaderByUid(uid) {
        return this.getHeaderContent().querySelector('[e-mappinguid=' + uid + ']').parentElement;
    }
    /**
     * Gets a Column by column name.
     * @param  {string} field - Specifies the column name.
     * @return {Column}
     */
    getColumnByField(field) {
        return iterateArrayOrObject(this.getColumns(), (item, index) => {
            if (item.field === field) {
                return item;
            }
            return undefined;
        })[0];
    }
    /**
     * Gets a column index by column name.
     * @param  {string} field - Specifies the column name.
     * @return {number}
     */
    getColumnIndexByField(field) {
        let index = iterateArrayOrObject(this.getColumns(), (item, index) => {
            if (item.field === field) {
                return index;
            }
            return undefined;
        })[0];
        return !isNullOrUndefined(index) ? index : -1;
    }
    /**
     * Gets a column by UID.
     * @param  {string} uid - Specifies the column UID.
     * @return {Column}
     */
    getColumnByUid(uid) {
        return iterateArrayOrObject(this.getColumns(), (item, index) => {
            if (item.uid === uid) {
                return item;
            }
            return undefined;
        })[0];
    }
    /**
     * Gets a column index by UID.
     * @param  {string} uid - Specifies the column UID.
     * @return {number}
     */
    getColumnIndexByUid(uid) {
        let index = iterateArrayOrObject(this.getColumns(), (item, index) => {
            if (item.uid === uid) {
                return index;
            }
            return undefined;
        })[0];
        return !isNullOrUndefined(index) ? index : -1;
    }
    /**
     * Gets UID by column name.
     * @param  {string} field - Specifies the column name.
     * @return {string}
     */
    getUidByColumnField(field) {
        return iterateArrayOrObject(this.getColumns(), (item, index) => {
            if (item.field === field) {
                return item.uid;
            }
            return undefined;
        })[0];
    }
    /**
     * Gets TH index by column uid value.
     * @private
     * @param  {string} uid - Specifies the column uid.
     * @return {number}
     */
    getNormalizedColumnIndex(uid) {
        let index = this.getColumnIndexByUid(uid);
        if (this.allowGrouping) {
            index += this.groupSettings.columns.length;
        }
        if (this.isDetail()) {
            index++;
        }
        /**
         * TODO: index normalization based on the stacked header, grouping and detailTemplate
         * and frozen should be handled here
         */
        return index;
    }
    /**
     * Gets the collection of column fields.
     * @return {string[]}
     */
    getColumnFieldNames() {
        let columnNames = [];
        let column;
        for (let i = 0, len = this.getColumns().length; i < len; i++) {
            column = this.getColumns()[i];
            if (column.visible) {
                columnNames.push(column.field);
            }
        }
        return columnNames;
    }
    /**
     * Gets a compiled row template.
     * @return {Function}
     * @private
     */
    getRowTemplate() {
        return this.rowTemplateFn;
    }
    /**
     * Gets a compiled detail row template.
     * @private
     * @return {Function}
     */
    getDetailTemplate() {
        return this.detailTemplateFn;
    }
    /**
     * Get the names of the primary key columns of the Grid.
     * @return {string[]}
     */
    getPrimaryKeyFieldNames() {
        let keys = [];
        for (let key = 0, col = this.columns, cLen = col.length; key < cLen; key++) {
            if (col[key].isPrimaryKey) {
                keys.push(col[key].field);
            }
        }
        return keys;
    }
    /**
     * Refreshes the Grid header and content.
     */
    refresh() {
        this.headerModule.refreshUI();
        this.updateStackedFilter();
        this.updateDefaultCursor();
        this.renderModule.refresh();
    }
    /**
     * Refreshes the Grid header.
     */
    refreshHeader() {
        this.headerModule.refreshUI();
    }
    /**
     * Gets the collection of selected rows.
     * @return {Element[]}
     */
    getSelectedRows() {
        return this.selectionModule ? this.selectionModule.selectedRecords : [];
    }
    /**
     * Gets the collection of selected row indexes.
     * @return {number[]}
     */
    getSelectedRowIndexes() {
        return this.selectionModule ? this.selectionModule.selectedRowIndexes : [];
    }
    /**
     * Gets the collection of selected row and cell indexes.
     * @return {number[]}
     */
    getSelectedRowCellIndexes() {
        return this.selectionModule.selectedRowCellIndexes;
    }
    /**
     * Gets the collection of selected records.
     * @return {Object[]}
     */
    getSelectedRecords() {
        return this.selectionModule.getSelectedRecords();
    }
    /**
     * Gets the data module.
     * @return {Data}
     */
    getDataModule() {
        return this.renderModule.data;
    }
    /**
     * Shows a column by its column name.
     * @param  {string|string[]} keys - Defines a single or collection of column names.
     * @param  {string} showBy - Defines the column key either as field name or header text.
     * @return {void}
     */
    showColumns(keys, showBy) {
        showBy = showBy ? showBy : 'headerText';
        this.showHider.show(keys, showBy);
    }
    /**
     * Hides a column by column name.
     * @param  {string|string[]} keys - Defines a single or collection of column names.
     * @param  {string} hideBy - Defines the column key either as field name or header text.
     * @return {void}
     */
    hideColumns(keys, hideBy) {
        hideBy = hideBy ? hideBy : 'headerText';
        this.showHider.hide(keys, hideBy);
    }
    /**
     * @hidden
     */
    getFrozenColumns() {
        return this.frozenColumns + this.getFrozenCount(this.columns, 0);
    }
    getFrozenCount(cols, cnt) {
        for (let i = 0, len = cols.length; i < len; i++) {
            if (cols[i].columns) {
                cnt = this.getFrozenCount(cols[i].columns, cnt);
            }
            else {
                if (cols[i].isFrozen) {
                    cnt++;
                }
            }
        }
        return cnt;
    }
    /**
     * Navigates to the specified target page.
     * @param  {number} pageNo - Defines the page number to navigate.
     * @return {void}
     */
    goToPage(pageNo) {
        this.pagerModule.goToPage(pageNo);
    }
    /**
     * Defines the text of external message.
     * @param  {string} message - Defines the message to update.
     * @return {void}
     */
    updateExternalMessage(message) {
        this.pagerModule.updateExternalMessage(message);
    }
    /**
     * Sorts a column with the given options.
     * @param {string} columnName - Defines the column name to be sorted.
     * @param {SortDirection} direction - Defines the direction of sorting field.
     * @param {boolean} isMultiSort - Specifies whether the previous sorted columns are to be maintained.
     * @return {void}
     */
    sortColumn(columnName, direction, isMultiSort) {
        this.sortModule.sortColumn(columnName, direction, isMultiSort);
    }
    /**
     * Clears all the sorted columns of the Grid.
     * @return {void}
     */
    clearSorting() {
        this.sortModule.clearSorting();
    }
    /**
     * Remove sorted column by field name.
     * @param {string} field - Defines the column field name to remove sort.
     * @return {void}
     * @hidden
     */
    removeSortColumn(field) {
        this.sortModule.removeSortColumn(field);
    }
    /**
     * Filters grid row by column name with the given options.
     * @param  {string} fieldName - Defines the field name of the column.
     * @param  {string} filterOperator - Defines the operator to filter records.
     * @param  {string | number | Date | boolean} filterValue - Defines the value used to filter records.
     * @param  {string} predicate - Defines the relationship between one filter query and another by using AND or OR predicate.
     * @param  {boolean} matchCase - If match case is set to true, the grid filters the records with exact match. if false, it filters case
     * insensitive records (uppercase and lowercase letters treated the same).
     * @param  {boolean} ignoreAccent - If ignoreAccent set to true,
     * then filter ignores the diacritic characters or accents while filtering.
     * @param  {string} actualFilterValue - Defines the actual filter value for the filter column.
     * @param  {string} actualOperator - Defines the actual filter operator for the filter column.
     * @return {void}
     */
    filterByColumn(fieldName, filterOperator, filterValue, predicate, matchCase, ignoreAccent, actualFilterValue, actualOperator) {
        this.filterModule.filterByColumn(fieldName, filterOperator, filterValue, predicate, matchCase, ignoreAccent, actualFilterValue, actualOperator);
    }
    /**
     * Clears all the filtered rows of the Grid.
     * @return {void}
     */
    clearFiltering() {
        this.filterModule.clearFiltering();
    }
    /**
     * Removes filtered column by field name.
     * @param  {string} field - Defines column field name to remove filter.
     * @param  {boolean} isClearFilterBar -  Specifies whether the filter bar value needs to be cleared.
     * @return {void}
     * @hidden
     */
    removeFilteredColsByField(field, isClearFilterBar) {
        this.filterModule.removeFilteredColsByField(field, isClearFilterBar);
    }
    /**
     * Selects a row by given index.
     * @param  {number} index - Defines the row index.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @return {void}
     */
    selectRow(index, isToggle) {
        this.selectionModule.selectRow(index, isToggle);
    }
    /**
     * Selects a collection of rows by indexes.
     * @param  {number[]} rowIndexes - Specifies the row indexes.
     * @return {void}
     */
    selectRows(rowIndexes) {
        this.selectionModule.selectRows(rowIndexes);
    }
    /**
     * Deselects the current selected rows and cells.
     * @return {void}
     */
    clearSelection() {
        this.selectionModule.clearSelection();
    }
    /**
     * Selects a cell by the given index.
     * @param  {IIndex} cellIndex - Defines the row and column indexes.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @return {void}
     */
    selectCell(cellIndex, isToggle) {
        this.selectionModule.selectCell(cellIndex, isToggle);
    }
    /**
     * Searches Grid records using the given key.
     * You can customize the default search option by using the
     * [`searchSettings`](./api-searchSettings.html).
     * @param  {string} searchString - Defines the key.
     * @return {void}
     */
    search(searchString) {
        this.searchModule.search(searchString);
    }
    /**
     * By default, prints all the pages of the Grid and hides the pager.
     * > You can customize print options using the
     * [`printMode`](./api-grid.html#printmode-string).
     * @return {void}
     */
    print() {
        this.printModule.print();
    }
    /**
     * Delete a record with Given options. If fieldname and data is not given then grid will delete the selected record.
     * > `editSettings.allowDeleting` should be true.
     * @param {string} fieldname - Defines the primary key field, 'Name of the column'.
     * @param {Object} data - Defines the JSON data of the record to be deleted.
     */
    deleteRecord(fieldname, data) {
        this.editModule.deleteRecord(fieldname, data);
    }
    /**
     * To edit any particular row by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row to be edited.
     */
    startEdit() {
        this.editModule.startEdit();
    }
    /**
     * If Grid is in editable state, you can save a record by invoking endEdit.
     */
    endEdit() {
        this.editModule.endEdit();
    }
    /**
     * Cancels edited state.
     */
    closeEdit() {
        this.editModule.closeEdit();
    }
    /**
     * Adds a new record to the Grid. Without passing parameters, it adds empty rows.
     * > `editSettings.allowEditing` should be true.
     * @param {Object} data - Defines the new add record data.
     * @param {number} index - Defines the row index to be added
     */
    addRecord(data, index) {
        this.editModule.addRecord(data, index);
    }
    /**
     * Delete any visible row by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row element.
     */
    deleteRow(tr) {
        this.editModule.deleteRow(tr);
    }
    /**
     * Copy the selected rows or cells data into clipboard.
     * @param {boolean} withHeader - Specifies whether the column header text needs to be copied along with rows or cells.
     */
    copy(withHeader) {
        this.clipboardModule.copy(withHeader);
    }
    /**
     * @hidden
     */
    recalcIndentWidth() {
        if (!this.getHeaderTable().querySelector('.e-emptycell')) {
            return;
        }
        if ((!this.groupSettings.columns.length && !this.isDetail()) ||
            this.getHeaderTable().querySelector('.e-emptycell').getAttribute('indentRefreshed') ||
            !this.getContentTable()) {
            return;
        }
        let indentWidth = this.getHeaderTable().querySelector('.e-emptycell').parentElement.offsetWidth;
        let headerCol = [].slice.call(this.getHeaderTable().querySelector('colgroup').childNodes);
        let contentCol = [].slice.call(this.getContentTable().querySelector('colgroup').childNodes);
        let perPixel = indentWidth / 30;
        let i = 0;
        if (perPixel >= 1) {
            indentWidth = (30 / perPixel);
        }
        if (this.enableColumnVirtualization) {
            indentWidth = 30;
        }
        while (i < this.groupSettings.columns.length) {
            headerCol[i].style.width = indentWidth + 'px';
            contentCol[i].style.width = indentWidth + 'px';
            this.notify(columnWidthChanged, { index: i, width: indentWidth });
            i++;
        }
        if (this.isDetail()) {
            headerCol[i].style.width = indentWidth + 'px';
            contentCol[i].style.width = indentWidth + 'px';
            this.notify(columnWidthChanged, { index: i, width: indentWidth });
        }
        this.getHeaderTable().querySelector('.e-emptycell').setAttribute('indentRefreshed', 'true');
    }
    /**
     * Changes the Grid column positions by field names.
     * @param  {string} fromFName - Defines the origin field name.
     * @param  {string} toFName - Defines the destination field name.
     * @return {void}
     */
    reorderColumns(fromFName, toFName) {
        this.reorderModule.reorderColumns(fromFName, toFName);
    }
    /**
     * Changes the column width to automatically fit its content to ensure that the width shows the content without wrapping/hiding.
     * > * This method ignores the hidden columns.
     * > * Uses the `autoFitColumns` method in the `dataBound` event to resize at initial rendering.
     * @param  {string |string[]} fieldNames - Defines the column names.
     * @return {void}
     *
     *
     * ```typescript
     * <div id="Grid"></div>
     * <script>
     * let gridObj: Grid = new Grid({
     *     dataSource: employeeData,
     *     columns: [
     *         { field: 'OrderID', headerText: 'Order ID', width:100 },
     *         { field: 'EmployeeID', headerText: 'Employee ID' }],
     *     dataBound: () => gridObj.autoFitColumns('EmployeeID')
     * });
     * gridObj.appendTo('#Grid');
     * </script>
     * ```
     *
     */
    autoFitColumns(fieldNames) {
        this.resizeModule.autoFitColumns(fieldNames);
    }
    /**
     * @hidden
     */
    createColumnchooser(x, y, target) {
        this.columnChooserModule.renderColumnChooser(x, y, target);
    }
    initializeServices() {
        this.serviceLocator.register('widthService', this.widthService = new ColumnWidthService(this));
        this.serviceLocator.register('cellRendererFactory', new CellRendererFactory);
        this.serviceLocator.register('rendererFactory', new RendererFactory);
        this.serviceLocator.register('localization', this.localeObj = new L10n(this.getModuleName(), this.defaultLocale, this.locale));
        this.serviceLocator.register('valueFormatter', this.valueFormatterService = new ValueFormatter(this.locale));
        this.serviceLocator.register('showHideService', this.showHider = new ShowHide(this));
        this.serviceLocator.register('ariaService', this.ariaService = new AriaService());
        this.serviceLocator.register('focus', this.focusModule = new FocusStrategy(this));
    }
    processModel() {
        let gCols = this.groupSettings.columns;
        let sCols = this.sortSettings.columns;
        let flag;
        let j;
        if (this.allowGrouping) {
            for (let i = 0, len = gCols.length; i < len; i++) {
                j = 0;
                for (let sLen = sCols.length; j < sLen; j++) {
                    if (sCols[j].field === gCols[i]) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    sCols.push({ field: gCols[i], direction: 'Ascending' });
                }
                else {
                    if (this.allowSorting) {
                        this.sortedColumns.push(sCols[j].field);
                    }
                    else {
                        sCols[j].direction = 'Ascending';
                    }
                }
                if (!this.groupSettings.showGroupedColumn) {
                    let column = this.enableColumnVirtualization ?
                        this.columns.filter((c) => c.field === gCols[i])[0] : this.getColumnByField(gCols[i]);
                    column.visible = false;
                }
            }
        }
        if (!gCols.length) {
            sCols.forEach((col) => {
                this.sortedColumns.push(col.field);
            });
        }
        this.rowTemplateFn = templateCompiler(this.rowTemplate);
        this.detailTemplateFn = templateCompiler(this.detailTemplate);
        if (!isNullOrUndefined(this.parentDetails)) {
            let value = isNullOrUndefined(this.parentDetails.parentKeyFieldValue) ? 'undefined' :
                this.parentDetails.parentKeyFieldValue;
            this.query.where(this.queryString, 'equal', value, true);
        }
        this.initForeignColumn();
    }
    initForeignColumn() {
        if (this.isForeignKeyEnabled(this.getColumns())) {
            this.notify(initForeignKeyColumn, this.getForeignKeyColumns());
        }
    }
    gridRender() {
        this.updateRTL();
        if (this.enableHover) {
            this.element.classList.add('e-gridhover');
        }
        if (Browser.isDevice) {
            this.element.classList.add('e-device');
        }
        if (this.rowHeight) {
            this.element.classList.add('e-grid-min-height');
        }
        classList(this.element, ['e-responsive', 'e-default'], []);
        let rendererFactory = this.serviceLocator.getService('rendererFactory');
        this.headerModule = rendererFactory.getRenderer(RenderType.Header);
        this.contentModule = rendererFactory.getRenderer(RenderType.Content);
        this.printModule = new Print(this, this.scrollModule);
        this.clipboardModule = new Clipboard(this);
        this.renderModule.render();
        this.eventInitializer();
        this.createGridPopUpElement();
        this.widthService.setWidthToColumns();
        this.updateGridLines();
        this.applyTextWrap();
    }
    dataReady() {
        this.scrollModule.setWidth();
        this.scrollModule.setHeight();
        if (this.height !== 'auto') {
            this.scrollModule.setPadding();
        }
    }
    updateRTL() {
        if (this.enableRtl) {
            this.element.classList.add('e-rtl');
        }
        else {
            this.element.classList.remove('e-rtl');
        }
    }
    createGridPopUpElement() {
        let popup = createElement('div', { className: 'e-gridpopup', styles: 'display:none;' });
        let content = createElement('div', { className: 'e-content', attrs: { tabIndex: '-1' } });
        append([content, createElement('div', { className: 'e-uptail e-tail' })], popup);
        content.appendChild(createElement('span'));
        append([content, createElement('div', { className: 'e-downtail e-tail' })], popup);
        this.element.appendChild(popup);
    }
    updateGridLines() {
        classList(this.element, [], ['e-verticallines', 'e-horizontallines', 'e-hidelines', 'e-bothlines']);
        switch (this.gridLines) {
            case 'Horizontal':
                this.element.classList.add('e-horizontallines');
                break;
            case 'Vertical':
                this.element.classList.add('e-verticallines');
                break;
            case 'None':
                this.element.classList.add('e-hidelines');
                break;
            case 'Both':
                this.element.classList.add('e-bothlines');
                break;
        }
        this.updateResizeLines();
    }
    updateResizeLines() {
        if (this.allowResizing &&
            !(this.gridLines === 'Vertical' || this.gridLines === 'Both')) {
            this.element.classList.add('e-resize-lines');
        }
        else {
            this.element.classList.remove('e-resize-lines');
        }
    }
    /**
     * The function is used to apply text wrap
     * @return {void}
     * @hidden
     */
    applyTextWrap() {
        if (this.allowTextWrap) {
            let headerRows = [].slice.call(this.element.querySelectorAll('.e-columnheader'));
            switch (this.textWrapSettings.wrapMode) {
                case 'Header':
                    wrap(this.element, false);
                    wrap(this.getContent(), false);
                    wrap(headerRows, true);
                    break;
                case 'Content':
                    wrap(this.getContent(), true);
                    wrap(this.element, false);
                    wrap(headerRows, false);
                    break;
                default:
                    wrap(this.element, true);
                    wrap(this.getContent(), false);
                    wrap(headerRows, false);
            }
        }
    }
    /**
     * The function is used to remove text wrap
     * @return {void}
     * @hidden
     */
    removeTextWrap() {
        wrap(this.element, false);
        let headerRows = [].slice.call(this.element.querySelectorAll('.e-columnheader'));
        wrap(headerRows, false);
        wrap(this.getContent(), false);
    }
    /**
     * The function is used to add Tooltip to the grid cell that has ellipsiswithtooltip clip mode.
     * @return {void}
     * @hidden
     */
    refreshTooltip() {
        let width;
        let headerTable = this.getHeaderTable();
        let contentTable = this.getContentTable();
        let headerDivTag = 'e-gridheader';
        let htable = this.createTable(headerTable, headerDivTag, 'header');
        let ctable = this.createTable(headerTable, headerDivTag, 'content');
        let all = this.element.querySelectorAll('.e-ellipsistooltip');
        let allele = [];
        for (let i = 0; i < all.length; i++) {
            allele[i] = all[i];
        }
        allele.forEach((element) => {
            let table = headerTable.contains(element) ? htable : ctable;
            let ele = headerTable.contains(element) ? 'th' : 'tr';
            table.querySelector(ele).className = element.className;
            table.querySelector(ele).innerHTML = element.innerHTML;
            width = table.querySelector(ele).getBoundingClientRect().width;
            if (width > element.getBoundingClientRect().width && !element.classList.contains('e-tooltip')) {
                let tooltip = new Tooltip({ content: element.innerHTML }, element);
            }
            else if (width < element.getBoundingClientRect().width && element.classList.contains('e-tooltip')) {
                element.ej2_instances[0].destroy();
            }
        });
        document.body.removeChild(htable);
        document.body.removeChild(ctable);
    }
    /**
     * To create table for ellipsiswithtooltip
     * @hidden
     */
    createTable(table, tag, type) {
        let myTableDiv = createElement('div');
        myTableDiv.className = this.element.className;
        myTableDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';
        let mySubDiv = createElement('div');
        mySubDiv.className = tag;
        let myTable = createElement('table');
        myTable.className = table.className;
        myTable.style.cssText = 'table-layout: auto;width: auto';
        let ele = (type === 'header') ? 'th' : 'td';
        let myTr = createElement('tr');
        let mytd = createElement(ele);
        myTr.appendChild(mytd);
        myTable.appendChild(myTr);
        mySubDiv.appendChild(myTable);
        myTableDiv.appendChild(mySubDiv);
        document.body.appendChild(myTableDiv);
        return myTableDiv;
    }
    /**
     * Binding events to the element while component creation.
     * @hidden
     */
    wireEvents() {
        EventHandler.add(this.element, 'click', this.mouseClickHandler, this);
        EventHandler.add(this.element, 'touchend', this.mouseClickHandler, this);
        EventHandler.add(this.element, 'focusout', this.focusOutHandler, this);
        EventHandler.add(this.getContent(), 'dblclick', this.dblClickHandler, this);
        if (this.allowKeyboard) {
            this.element.tabIndex = this.element.tabIndex === -1 ? 0 : this.element.tabIndex;
        }
        this.keyboardModule = new KeyboardEvents(this.element, {
            keyAction: this.keyActionHandler.bind(this),
            keyConfigs: this.keyConfigs,
            eventName: 'keydown'
        });
    }
    /**
     * Unbinding events from the element while component destroy.
     * @hidden
     */
    unwireEvents() {
        EventHandler.remove(this.element, 'click', this.mouseClickHandler);
        EventHandler.remove(this.element, 'touchend', this.mouseClickHandler);
        EventHandler.remove(this.element, 'focusout', this.focusOutHandler);
    }
    /**
     * @hidden
     */
    addListener() {
        if (this.isDestroyed) {
            return;
        }
        this.on(dataReady, this.dataReady, this);
        this.on(contentReady, this.recalcIndentWidth, this);
        [updateData, modelChanged, contentReady, columnWidthChanged].forEach((event) => this.on(event, this.refreshTooltip, this));
        this.on(headerRefreshed, this.recalcIndentWidth, this);
        this.dataBoundFunction = this.refreshMediaCol.bind(this);
        this.addEventListener(dataBound, this.dataBoundFunction);
    }
    /**
     * @hidden
     */
    removeListener() {
        if (this.isDestroyed) {
            return;
        }
        this.off(dataReady, this.dataReady);
        this.off(contentReady, this.recalcIndentWidth);
        [updateData, modelChanged, contentReady, columnWidthChanged].forEach((event) => this.off(event, this.refreshTooltip));
        this.off(headerRefreshed, this.recalcIndentWidth);
        this.removeEventListener(dataBound, this.dataBoundFunction);
    }
    /**
     * Get current visible data of grid.
     * @return {Object[]}
     * @hidden
     */
    getCurrentViewRecords() {
        return (this.allowGrouping && this.groupSettings.columns.length) ?
            this.currentViewData.records : this.currentViewData;
    }
    mouseClickHandler(e) {
        if (this.isChildGrid(e) || (parentsUntil(e.target, 'e-gridpopup') && e.touches) ||
            this.element.querySelectorAll('.e-cloneproperties').length || this.checkEdit(e)) {
            return;
        }
        if (((!this.allowRowDragAndDrop && (parentsUntil(e.target, 'e-gridcontent') ||
            e.target.tagName === 'TD')) || (!(this.allowGrouping || this.allowReordering) &&
            parentsUntil(e.target, 'e-gridheader'))) && e.touches) {
            return;
        }
        if (parentsUntil(e.target, 'e-gridheader') && this.allowRowDragAndDrop) {
            e.preventDefault();
        }
        this.notify(click, e);
    }
    checkEdit(e) {
        let tr = parentsUntil(e.target, 'e-row');
        let isEdit = this.editSettings.mode !== 'Batch' &&
            this.isEdit && tr && (tr.classList.contains('e-editedrow') || tr.classList.contains('e-addedrow'));
        return !parentsUntil(e.target, 'e-unboundcelldiv') && (isEdit || (parentsUntil(e.target, 'e-rowcell') &&
            parentsUntil(e.target, 'e-rowcell').classList.contains('e-editedbatchcell')));
    }
    dblClickHandler(e) {
        let grid = parentsUntil(e.target, 'e-grid');
        if (isNullOrUndefined(grid) || grid.id !== this.element.id || closest(e.target, '.e-unboundcelldiv')) {
            return;
        }
        let args = this.getRowInfo(e.target);
        args.target = e.target;
        this.trigger(recordDoubleClick, args);
        this.notify(dblclick, e);
    }
    focusOutHandler(e) {
        if (this.isChildGrid(e)) {
            return;
        }
        if (!parentsUntil(e.target, 'e-grid')) {
            this.element.querySelector('.e-gridpopup').style.display = 'None';
        }
        let filterClear = this.element.querySelector('.e-cancel:not(.e-hide)');
        if (filterClear) {
            filterClear.classList.add('e-hide');
        }
        if (!e.relatedTarget && !this.keyPress && this.editSettings.mode === 'Batch' && this.isEdit) {
            this.editModule.saveCell();
        }
        this.keyPress = false;
    }
    isChildGrid(e) {
        let gridElement = parentsUntil(e.target, 'e-grid');
        if (gridElement && gridElement.id !== this.element.id) {
            return true;
        }
        return false;
    }
    mergePersistGridData() {
        let data = window.localStorage.getItem(this.getModuleName() + this.element.id);
        if (!(isNullOrUndefined(data) || (data === ''))) {
            let dataObj = JSON.parse(data);
            let keys = Object.keys(dataObj);
            this.isProtectedOnChange = true;
            for (let key of keys) {
                if ((typeof this[key] === 'object') && !isNullOrUndefined(this[key])) {
                    if (Array.isArray(this[key])) {
                        this[key].forEach((element, index, arr) => {
                            arr[index] = extend({}, element, dataObj[key][index], true);
                        });
                    }
                    else {
                        extend(this[key], dataObj[key]);
                    }
                }
                else {
                    this[key] = dataObj[key];
                }
            }
            this.isProtectedOnChange = false;
        }
    }
    isDetail() {
        return !isNullOrUndefined(this.detailTemplate) || !isNullOrUndefined(this.childGrid);
    }
    isCommandColumn(columns) {
        return columns.some((col) => {
            if (col.columns) {
                return this.isCommandColumn(col.columns);
            }
            return !!(col.commands || col.commandsTemplate);
        });
    }
    isForeignKeyEnabled(columns) {
        return columns.some((col) => {
            if (col.columns) {
                return this.isForeignKeyEnabled(col.columns);
            }
            return !!(col.dataSource && col.foreignKeyValue);
        });
    }
    keyActionHandler(e) {
        this.keyPress = true;
        if (this.isChildGrid(e) ||
            (this.isEdit && e.action !== 'escape' && e.action !== 'enter' && e.action !== 'shiftEnter'
                && e.action !== 'tab' && e.action !== 'shiftTab')) {
            return;
        }
        if (this.allowKeyboard) {
            if (e.action === 'ctrlPlusP') {
                e.preventDefault();
                this.print();
            }
            this.notify(keyPressed, e);
        }
    }
    /**
     * @hidden
     */
    setInjectedModules(modules) {
        this.injectedModules = modules;
    }
    updateColumnObject() {
        prepareColumns(this.columns, this.enableColumnVirtualization);
        this.initForeignColumn();
        this.notify(autoCol, {});
    }
    /**
     * Gets the foreign columns from Grid.
     * @return {Column[]}
     */
    getForeignKeyColumns() {
        return this.getColumns().filter((col) => {
            return col.isForeignColumn();
        });
    }
    /**
     * Refreshes the Grid column changes.
     */
    refreshColumns() {
        this.updateColumnObject();
        this.refresh();
    }
    /**
     * Export Grid data to Excel file(.xlsx).
     * @param  {ExcelExportProperties} excelExportProperties - Defines the export properties of the Grid.
     * @param  {boolean} isMultipleExport - Define to enable multiple export.
     * @param  {workbook} workbook - Defines the Workbook if multiple export is enabled.
     * @param  {boolean} isBlob - If 'isBlob' set to true, then it will be returned as blob data.
     * @return {Promise<any>}
     */
    excelExport(excelExportProperties, isMultipleExport, 
        /* tslint:disable-next-line:no-any */
        workbook, isBlob) {
        return this.excelExportModule.Map(this, excelExportProperties, isMultipleExport, workbook, false, isBlob);
    }
    /**
     * Export Grid data to CSV file.
     * @param  {ExcelExportProperties} excelExportProperties - Defines the export properties of the Grid.
     * @param  {boolean} isMultipleExport - Define to enable multiple export.
     * @param  {workbook} workbook - Defines the Workbook if multiple export is enabled.
     * @param  {boolean} isBlob - If 'isBlob' set to true, then it will be returned as blob data.
     * @return {Promise<any>}
     *
     */
    csvExport(excelExportProperties, 
        /* tslint:disable-next-line:no-any */
        isMultipleExport, workbook, isBlob) {
        return this.excelExportModule.Map(this, excelExportProperties, isMultipleExport, workbook, true, isBlob);
    }
    /**
     * Export Grid data to PDF document.
     * @param  {pdfExportProperties} PdfExportProperties - Defines the export properties of the Grid.
     * @param  {isMultipleExport} isMultipleExport - Define to enable multiple export.
     * @param  {pdfDoc} pdfDoc - Defined the Pdf Document if multiple export is enabled.
     * @param  {boolean} isBlob - If 'isBlob' set to true, then it will be returned as blob data.
     * @return {Promise<any>}
     *
     */
    pdfExport(pdfExportProperties, 
        /* tslint:disable-next-line:no-any */
        isMultipleExport, pdfDoc, isBlob) {
        return this.pdfExportModule.Map(this, pdfExportProperties, isMultipleExport, pdfDoc, isBlob);
    }
    /**
     * Groups a column by column name.
     * @param  {string} columnName - Defines the column name to group.
     * @return {void}
     */
    groupColumn(columnName) {
        this.groupModule.groupColumn(columnName);
    }
    /**
     * Ungroups a column by column name.
     * @param  {string} columnName - Defines the column name to ungroup.
     * @return {void}
     */
    ungroupColumn(columnName) {
        this.groupModule.ungroupColumn(columnName);
    }
    /**
     * @hidden
     */
    isContextMenuOpen() {
        return this.contextMenuModule && this.contextMenuModule.isOpen;
    }
    /**
     * @hidden
     */
    ensureModuleInjected(module) {
        return this.getInjectedModules().indexOf(module) >= 0;
    }
    /**
     * Destroys the given template reference.
     * @param {string[]} propertyNames - Defines the collection of template name.
     */
    destroyTemplate(propertyNames) {
        this.clearTemplate(propertyNames);
    }
};
__decorate([
    Property([])
], Grid.prototype, "columns", void 0);
__decorate([
    Property(true)
], Grid.prototype, "enableAltRow", void 0);
__decorate([
    Property(true)
], Grid.prototype, "enableHover", void 0);
__decorate([
    Property(true)
], Grid.prototype, "allowKeyboard", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowTextWrap", void 0);
__decorate([
    Complex({}, TextWrapSettings)
], Grid.prototype, "textWrapSettings", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowPaging", void 0);
__decorate([
    Complex({}, PageSettings)
], Grid.prototype, "pageSettings", void 0);
__decorate([
    Property(false)
], Grid.prototype, "enableVirtualization", void 0);
__decorate([
    Property(false)
], Grid.prototype, "enableColumnVirtualization", void 0);
__decorate([
    Complex({}, SearchSettings)
], Grid.prototype, "searchSettings", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowSorting", void 0);
__decorate([
    Property(true)
], Grid.prototype, "allowMultiSorting", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowExcelExport", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowPdfExport", void 0);
__decorate([
    Complex({}, SortSettings)
], Grid.prototype, "sortSettings", void 0);
__decorate([
    Property(true)
], Grid.prototype, "allowSelection", void 0);
__decorate([
    Property(-1)
], Grid.prototype, "selectedRowIndex", void 0);
__decorate([
    Complex({}, SelectionSettings)
], Grid.prototype, "selectionSettings", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowFiltering", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowReordering", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowResizing", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowRowDragAndDrop", void 0);
__decorate([
    Complex({}, RowDropSettings)
], Grid.prototype, "rowDropSettings", void 0);
__decorate([
    Complex({}, FilterSettings)
], Grid.prototype, "filterSettings", void 0);
__decorate([
    Property(false)
], Grid.prototype, "allowGrouping", void 0);
__decorate([
    Property(false)
], Grid.prototype, "showColumnMenu", void 0);
__decorate([
    Complex({}, GroupSettings)
], Grid.prototype, "groupSettings", void 0);
__decorate([
    Complex({}, EditSettings)
], Grid.prototype, "editSettings", void 0);
__decorate([
    Collection([], AggregateRow)
], Grid.prototype, "aggregates", void 0);
__decorate([
    Property(false)
], Grid.prototype, "showColumnChooser", void 0);
__decorate([
    Property('auto')
], Grid.prototype, "height", void 0);
__decorate([
    Property('auto')
], Grid.prototype, "width", void 0);
__decorate([
    Property('Default')
], Grid.prototype, "gridLines", void 0);
__decorate([
    Property()
], Grid.prototype, "rowTemplate", void 0);
__decorate([
    Property()
], Grid.prototype, "detailTemplate", void 0);
__decorate([
    Property()
], Grid.prototype, "childGrid", void 0);
__decorate([
    Property()
], Grid.prototype, "queryString", void 0);
__decorate([
    Property('AllPages')
], Grid.prototype, "printMode", void 0);
__decorate([
    Property([])
], Grid.prototype, "dataSource", void 0);
__decorate([
    Property(null)
], Grid.prototype, "rowHeight", void 0);
__decorate([
    Property()
], Grid.prototype, "query", void 0);
__decorate([
    Property('USD')
], Grid.prototype, "currencyCode", void 0);
__decorate([
    Property()
], Grid.prototype, "toolbar", void 0);
__decorate([
    Property()
], Grid.prototype, "contextMenuItems", void 0);
__decorate([
    Property()
], Grid.prototype, "columnMenuItems", void 0);
__decorate([
    Property()
], Grid.prototype, "toolbarTemplate", void 0);
__decorate([
    Property()
], Grid.prototype, "pagerTemplate", void 0);
__decorate([
    Property(0)
], Grid.prototype, "frozenRows", void 0);
__decorate([
    Property(0)
], Grid.prototype, "frozenColumns", void 0);
__decorate([
    Event()
], Grid.prototype, "created", void 0);
__decorate([
    Event()
], Grid.prototype, "destroyed", void 0);
__decorate([
    Event()
], Grid.prototype, "load", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDataBound", void 0);
__decorate([
    Event()
], Grid.prototype, "queryCellInfo", void 0);
__decorate([
    Event()
], Grid.prototype, "actionBegin", void 0);
__decorate([
    Event()
], Grid.prototype, "actionComplete", void 0);
__decorate([
    Event()
], Grid.prototype, "actionFailure", void 0);
__decorate([
    Event()
], Grid.prototype, "dataBound", void 0);
__decorate([
    Event()
], Grid.prototype, "recordDoubleClick", void 0);
__decorate([
    Event()
], Grid.prototype, "rowSelecting", void 0);
__decorate([
    Event()
], Grid.prototype, "rowSelected", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDeselecting", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDeselected", void 0);
__decorate([
    Event()
], Grid.prototype, "cellSelecting", void 0);
__decorate([
    Event()
], Grid.prototype, "cellSelected", void 0);
__decorate([
    Event()
], Grid.prototype, "cellDeselecting", void 0);
__decorate([
    Event()
], Grid.prototype, "cellDeselected", void 0);
__decorate([
    Event()
], Grid.prototype, "columnDragStart", void 0);
__decorate([
    Event()
], Grid.prototype, "columnDrag", void 0);
__decorate([
    Event()
], Grid.prototype, "columnDrop", void 0);
__decorate([
    Event()
], Grid.prototype, "printComplete", void 0);
__decorate([
    Event()
], Grid.prototype, "beforePrint", void 0);
__decorate([
    Event()
], Grid.prototype, "pdfQueryCellInfo", void 0);
__decorate([
    Event()
], Grid.prototype, "excelQueryCellInfo", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeExcelExport", void 0);
__decorate([
    Event()
], Grid.prototype, "excelExportComplete", void 0);
__decorate([
    Event()
], Grid.prototype, "beforePdfExport", void 0);
__decorate([
    Event()
], Grid.prototype, "pdfExportComplete", void 0);
__decorate([
    Event()
], Grid.prototype, "detailDataBound", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDragStart", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDrag", void 0);
__decorate([
    Event()
], Grid.prototype, "rowDrop", void 0);
__decorate([
    Event()
], Grid.prototype, "toolbarClick", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeOpenColumnChooser", void 0);
__decorate([
    Event()
], Grid.prototype, "batchAdd", void 0);
__decorate([
    Event()
], Grid.prototype, "batchDelete", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeBatchAdd", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeBatchDelete", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeBatchSave", void 0);
__decorate([
    Event()
], Grid.prototype, "beginEdit", void 0);
__decorate([
    Event()
], Grid.prototype, "cellEdit", void 0);
__decorate([
    Event()
], Grid.prototype, "cellSave", void 0);
__decorate([
    Event()
], Grid.prototype, "resizeStart", void 0);
__decorate([
    Event()
], Grid.prototype, "resizing", void 0);
__decorate([
    Event()
], Grid.prototype, "resizeStop", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeDataBound", void 0);
__decorate([
    Event()
], Grid.prototype, "contextMenuOpen", void 0);
__decorate([
    Event()
], Grid.prototype, "contextMenuClick", void 0);
__decorate([
    Event()
], Grid.prototype, "columnMenuOpen", void 0);
__decorate([
    Event()
], Grid.prototype, "columnMenuClick", void 0);
__decorate([
    Event()
], Grid.prototype, "checkBoxChange", void 0);
__decorate([
    Event()
], Grid.prototype, "beforeCopy", void 0);
__decorate([
    Event()
], Grid.prototype, "dataStateChange", void 0);
__decorate([
    Event()
], Grid.prototype, "dataSourceChanged", void 0);
Grid = __decorate([
    NotifyPropertyChanges
], Grid);
Grid.Inject(Selection);

/**
 * Base export
 */

/**
 *
 * The `Sort` module is used to handle sorting action.
 */
class Sort {
    /**
     * Constructor for Grid sorting module
     * @hidden
     */
    constructor(parent, sortSettings, sortedColumns, locator) {
        this.contentRefresh = true;
        this.isModelChanged = true;
        this.aria = new AriaService();
        this.parent = parent;
        this.sortSettings = sortSettings;
        this.sortedColumns = sortedColumns;
        this.focus = locator.getService('focus');
        this.addEventListener();
    }
    /**
     * The function used to update sortSettings
     * @return {void}
     * @hidden
     */
    updateModel() {
        let sortedColumn = { field: this.columnName, direction: this.direction };
        let index;
        let gCols = this.parent.groupSettings.columns;
        let flag = false;
        if (!this.isMultiSort) {
            if (!gCols.length) {
                this.sortSettings.columns = [sortedColumn];
            }
            else {
                let sortedCols = [];
                for (let i = 0, len = gCols.length; i < len; i++) {
                    index = this.getSortedColsIndexByField(gCols[i], sortedCols);
                    if (this.columnName === gCols[i]) {
                        flag = true;
                        sortedCols.push(sortedColumn);
                    }
                    else {
                        let sCol = this.getSortColumnFromField(gCols[i]);
                        sortedCols.push({ field: sCol.field, direction: sCol.direction });
                    }
                }
                if (!flag) {
                    sortedCols.push(sortedColumn);
                }
                this.sortSettings.columns = sortedCols;
            }
        }
        else {
            index = this.getSortedColsIndexByField(this.columnName);
            if (index > -1) {
                this.sortSettings.columns.splice(index, 1);
            }
            this.sortSettings.columns.push(sortedColumn);
            this.sortSettings.columns = this.sortSettings.columns;
        }
        this.parent.dataBind();
        this.lastSortedCol = this.columnName;
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        let args = !this.isRemove ? {
            columnName: this.columnName, direction: this.direction, requestType: 'sorting', type: actionComplete
        } : { requestType: 'sorting', type: actionComplete };
        this.isRemove = false;
        this.parent.trigger(actionComplete, extend(e, args));
    }
    /**
     * Sorts a column with the given options.
     * @param {string} columnName - Defines the column name to sort.
     * @param {SortDirection} direction - Defines the direction of sorting field.
     * @param {boolean} isMultiSort - Specifies whether the previously sorted columns are to be maintained.
     * @return {void}
     */
    sortColumn(columnName, direction, isMultiSort) {
        let gObj = this.parent;
        if (this.parent.getColumnByField(columnName).allowSorting === false || this.parent.isContextMenuOpen()) {
            return;
        }
        if (!gObj.allowMultiSorting) {
            isMultiSort = gObj.allowMultiSorting;
        }
        if (this.isActionPrevent()) {
            gObj.notify(preventBatch, {
                instance: this, handler: this.sortColumn,
                arg1: columnName, arg2: direction, arg3: isMultiSort
            });
            return;
        }
        this.columnName = columnName;
        this.direction = direction;
        this.isMultiSort = isMultiSort;
        this.removeSortIcons();
        let column = gObj.getColumnHeaderByField(columnName);
        this.updateSortedCols(columnName, isMultiSort);
        this.updateModel();
    }
    updateSortedCols(columnName, isMultiSort) {
        if (!isMultiSort) {
            if (this.parent.allowGrouping) {
                for (let i = 0, len = this.sortedColumns.length; i < len; i++) {
                    if (this.parent.groupSettings.columns.indexOf(this.sortedColumns[i]) < 0) {
                        this.sortedColumns.splice(i, 1);
                        len--;
                        i--;
                    }
                }
            }
            else {
                this.sortedColumns.splice(0, this.sortedColumns.length);
            }
        }
        if (this.sortedColumns.indexOf(columnName) < 0) {
            this.sortedColumns.push(columnName);
        }
    }
    /**
     * @hidden
     */
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        if (this.contentRefresh) {
            let args = this.sortSettings.columns.length ? {
                columnName: this.columnName, direction: this.direction, requestType: 'sorting', type: actionBegin
            } : { requestType: 'sorting', type: actionBegin };
            this.parent.notify(modelChanged, args);
        }
        this.removeSortIcons();
        this.addSortIcons();
    }
    /**
     * Clears all the sorted columns of the Grid.
     * @return {void}
     */
    clearSorting() {
        let cols = getActualPropFromColl(this.sortSettings.columns);
        if (this.isActionPrevent()) {
            this.parent.notify(preventBatch, { instance: this, handler: this.clearSorting });
            return;
        }
        for (let i = 0, len = cols.length; i < len; i++) {
            this.removeSortColumn(cols[i].field);
        }
    }
    isActionPrevent() {
        return isActionPrevent(this.parent);
    }
    /**
     * Remove sorted column by field name.
     * @param {string} field - Defines the column field name to remove sort.
     * @return {void}
     * @hidden
     */
    removeSortColumn(field) {
        let gObj = this.parent;
        let cols = this.sortSettings.columns;
        if (this.sortedColumns.indexOf(field) < 0) {
            return;
        }
        if (this.isActionPrevent()) {
            this.parent.notify(preventBatch, { instance: this, handler: this.removeSortColumn, arg1: field });
            return;
        }
        this.removeSortIcons();
        for (let i = 0, len = cols.length; i < len; i++) {
            if (cols[i].field === field) {
                if (gObj.allowGrouping && gObj.groupSettings.columns.indexOf(cols[i].field) > -1) {
                    continue;
                }
                this.sortedColumns.splice(this.sortedColumns.indexOf(cols[i].field), 1);
                cols.splice(i, 1);
                this.isRemove = true;
                if (this.isModelChanged) {
                    this.parent.notify(modelChanged, {
                        requestType: 'sorting', type: actionBegin
                    });
                }
                break;
            }
        }
        this.addSortIcons();
    }
    getSortedColsIndexByField(field, sortedColumns) {
        let cols = sortedColumns ? sortedColumns : this.sortSettings.columns;
        for (let i = 0, len = cols.length; i < len; i++) {
            if (cols[i].field === field) {
                return i;
            }
        }
        return -1;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'sort';
    }
    initialEnd() {
        this.parent.off(contentReady, this.initialEnd);
        if (this.parent.getColumns().length && this.sortSettings.columns.length) {
            let gObj = this.parent;
            this.contentRefresh = false;
            this.isMultiSort = this.sortSettings.columns.length > 1;
            for (let col of gObj.sortSettings.columns) {
                if (this.sortedColumns.indexOf(col.field) > -1) {
                    this.sortColumn(col.field, col.direction, true);
                }
            }
            this.isMultiSort = false;
            this.contentRefresh = true;
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(contentReady, this.initialEnd, this);
        this.parent.on(sortComplete, this.onActionComplete, this);
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(headerRefreshed, this.refreshSortIcons, this);
        this.parent.on(keyPressed, this.keyPressed, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(sortComplete, this.onActionComplete);
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(click, this.clickHandler);
        this.parent.off(headerRefreshed, this.refreshSortIcons);
        this.parent.off(keyPressed, this.keyPressed);
    }
    /**
     * To destroy the sorting
     * @return {void}
     * @hidden
     */
    destroy() {
        this.isModelChanged = false;
        if (this.parent.element.querySelector('.e-gridpopup').querySelectorAll('.e-sortdirect').length) {
            this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
        }
        this.clearSorting();
        this.isModelChanged = true;
        this.removeEventListener();
    }
    clickHandler(e) {
        this.popUpClickHandler(e);
        let target = closest(e.target, '.e-headercell');
        if (target && !e.target.classList.contains('e-grptogglebtn') &&
            !e.target.classList.contains('e-stackedheadercell') &&
            !e.target.classList.contains('e-stackedheadercelldiv') &&
            !(target.classList.contains('e-resized')) &&
            !e.target.classList.contains('e-rhandler') &&
            !e.target.classList.contains('e-columnmenu') &&
            !e.target.classList.contains('e-filtermenudiv')) {
            let gObj = this.parent;
            let colObj = gObj.getColumnByUid(target.querySelector('.e-headercelldiv').getAttribute('e-mappinguid'));
            let direction = !target.querySelectorAll('.e-ascending').length ? 'Ascending' :
                'Descending';
            if (colObj.type !== 'checkbox') {
                this.initiateSort(target, e, colObj);
                if (Browser.isDevice) {
                    this.showPopUp(e);
                }
            }
        }
        if (target) {
            target.classList.remove('e-resized');
        }
    }
    keyPressed(e) {
        let ele = e.target;
        if (!this.parent.isEdit && (e.action === 'enter' || e.action === 'ctrlEnter' || e.action === 'shiftEnter')
            && closest(ele, '.e-headercell')) {
            let target = this.focus.getFocusedElement();
            if (isNullOrUndefined(target) || !target.classList.contains('e-headercell')
                || !target.querySelector('.e-headercelldiv')) {
                return;
            }
            let col = this.parent.getColumnByUid(target.querySelector('.e-headercelldiv').getAttribute('e-mappinguid'));
            this.initiateSort(target, e, col);
        }
    }
    initiateSort(target, e, column) {
        let gObj = this.parent;
        let field = column.field;
        let direction = !target.querySelectorAll('.e-ascending').length ? 'Ascending' :
            'Descending';
        if (e.shiftKey || (this.sortSettings.allowUnsort && target.querySelectorAll('.e-descending').length)
            && !(gObj.groupSettings.columns.indexOf(field) > -1)) {
            this.removeSortColumn(field);
        }
        else {
            this.sortColumn(field, direction, e.ctrlKey || this.enableSortMultiTouch);
        }
    }
    showPopUp(e) {
        let target = closest(e.target, '.e-headercell');
        if (!isNullOrUndefined(target) || this.parent.isContextMenuOpen()) {
            setCssInGridPopUp(this.parent.element.querySelector('.e-gridpopup'), e, 'e-sortdirect e-icons e-icon-sortdirect' + (this.sortedColumns.length > 1 ? ' e-spanclicked' : ''));
        }
    }
    popUpClickHandler(e) {
        let target = e.target;
        if (closest(target, '.e-headercell') || e.target.classList.contains('e-rowcell') ||
            closest(target, '.e-gridpopup')) {
            if (target.classList.contains('e-sortdirect')) {
                if (!target.classList.contains('e-spanclicked')) {
                    target.classList.add('e-spanclicked');
                    this.enableSortMultiTouch = true;
                }
                else {
                    target.classList.remove('e-spanclicked');
                    this.enableSortMultiTouch = false;
                    this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
                }
            }
        }
        else {
            this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
        }
    }
    addSortIcons() {
        let gObj = this.parent;
        let header;
        let filterElement;
        let cols = this.sortSettings.columns;
        let fieldNames = this.parent.getColumns().map((c) => c.field);
        for (let i = 0, len = cols.length; i < len; i++) {
            if (fieldNames.indexOf(cols[i].field) === -1) {
                continue;
            }
            header = gObj.getColumnHeaderByField(cols[i].field);
            this.aria.setSort(header, cols[i].direction);
            if (this.isMultiSort && cols.length > 1) {
                header.querySelector('.e-headercelldiv').insertBefore(createElement('span', { className: 'e-sortnumber', innerHTML: (i + 1).toString() }), header.querySelector('.e-headertext'));
            }
            filterElement = header.querySelector('.e-sortfilterdiv');
            if (cols[i].direction === 'Ascending') {
                classList(filterElement, ['e-ascending', 'e-icon-ascending'], []);
            }
            else {
                classList(filterElement, ['e-descending', 'e-icon-descending'], []);
            }
        }
    }
    removeSortIcons(position) {
        let gObj = this.parent;
        let header;
        let cols = this.sortSettings.columns;
        let fieldNames = this.parent.getColumns().map((c) => c.field);
        for (let i = position ? position : 0, len = !isNullOrUndefined(position) ? position + 1 : cols.length; i < len; i++) {
            if (gObj.allowGrouping && gObj.groupSettings.columns.indexOf(cols[i].field) > -1) {
                continue;
            }
            if (fieldNames.indexOf(cols[i].field) === -1) {
                continue;
            }
            header = gObj.getColumnHeaderByField(cols[i].field);
            this.aria.setSort(header, 'none');
            classList(header.querySelector('.e-sortfilterdiv'), [], ['e-descending', 'e-icon-descending', 'e-ascending', 'e-icon-ascending']);
            if (header.querySelector('.e-sortnumber')) {
                header.querySelector('.e-headercelldiv').removeChild(header.querySelector('.e-sortnumber'));
            }
        }
    }
    getSortColumnFromField(field) {
        for (let i = 0, len = this.sortSettings.columns.length; i < len; i++) {
            if (this.sortSettings.columns[i].field === field) {
                return this.sortSettings.columns[i];
            }
        }
        return false;
    }
    updateAriaAttr() {
        let fieldNames = this.parent.getColumns().map((c) => c.field);
        for (let col of this.sortedColumns) {
            if (fieldNames.indexOf(col) === -1) {
                continue;
            }
            let header = this.parent.getColumnHeaderByField(col);
            this.aria.setSort(header, this.getSortColumnFromField(col).direction);
        }
    }
    refreshSortIcons() {
        this.removeSortIcons();
        this.isMultiSort = true;
        this.removeSortIcons();
        this.addSortIcons();
        this.isMultiSort = false;
        this.updateAriaAttr();
    }
}

/**
 * `NumericContainer` module handles rendering and refreshing numeric container.
 */
class NumericContainer {
    /**
     * Constructor for numericContainer module
     * @hidden
     */
    constructor(pagerModule) {
        this.pagerModule = pagerModule;
    }
    /**
     * The function is used to render numericContainer
     * @hidden
     */
    render() {
        this.pagerElement = this.pagerModule.element;
        this.renderNumericContainer();
        this.refreshNumericLinks();
        this.wireEvents();
    }
    /**
     * Refreshes the numeric container of Pager.
     */
    refresh() {
        this.pagerModule.updateTotalPages();
        if (this.links.length) {
            this.updateLinksHtml();
        }
        this.updateStyles();
    }
    /**
     * The function is used to refresh refreshNumericLinks
     * @hidden
     */
    refreshNumericLinks() {
        let link;
        let pagerObj = this.pagerModule;
        let div = pagerObj.element.querySelector('.e-numericcontainer');
        let frag = document.createDocumentFragment();
        div.innerHTML = '';
        for (let i = 1; i <= pagerObj.pageCount; i++) {
            link = createElement('a', {
                className: 'e-link e-numericitem e-spacing e-pager-default',
                attrs: { role: 'link', tabindex: '-1', 'aria-label': 'Goto Page ' + i,
                    href: 'javascript:void(0);', name: 'Goto page' + i }
            });
            if (pagerObj.currentPage === i) {
                classList(link, ['e-currentitem', 'e-active'], ['e-pager-default']);
            }
            frag.appendChild(link);
        }
        div.appendChild(frag);
        this.links = [].slice.call(div.childNodes);
    }
    /**
     * Binding events to the element while component creation
     * @hidden
     */
    wireEvents() {
        EventHandler.add(this.pagerElement, 'click', this.clickHandler, this);
    }
    /**
     * Unbinding events from the element while component destroy
     * @hidden
     */
    unwireEvents() {
        EventHandler.remove(this.pagerElement, 'click', this.clickHandler);
    }
    /**
     * To destroy the PagerMessage
     * @method destroy
     * @return {void}
     * @hidden
     */
    destroy() {
        this.unwireEvents();
    }
    renderNumericContainer() {
        this.element = createElement('div', {
            className: 'e-pagercontainer', attrs: { 'role': 'navigation' }
        });
        this.renderFirstNPrev(this.element);
        this.renderPrevPagerSet(this.element);
        this.element.appendChild(createElement('div', { className: 'e-numericcontainer' }));
        this.renderNextPagerSet(this.element);
        this.renderNextNLast(this.element);
        this.pagerModule.element.appendChild(this.element);
    }
    renderFirstNPrev(pagerContainer) {
        this.first = createElement('div', {
            className: 'e-first e-icons e-icon-first',
            attrs: {
                title: this.pagerModule.getLocalizedLabel('firstPageTooltip'),
                'aria-label': this.pagerModule.getLocalizedLabel('firstPageTooltip'),
                tabindex: '-1'
            }
        });
        this.prev = createElement('div', {
            className: 'e-prev e-icons e-icon-prev',
            attrs: {
                title: this.pagerModule.getLocalizedLabel('previousPageTooltip'),
                'aria-label': this.pagerModule.getLocalizedLabel('previousPageTooltip'),
                tabindex: '-1'
            }
        });
        append([this.first, this.prev], pagerContainer);
    }
    renderPrevPagerSet(pagerContainer) {
        let prevPager = createElement('div');
        this.PP = createElement('a', {
            className: 'e-link e-pp e-spacing', innerHTML: '...',
            attrs: {
                title: this.pagerModule.getLocalizedLabel('previousPagerTooltip'), role: 'link',
                'aria-label': this.pagerModule.getLocalizedLabel('previousPagerTooltip'),
                tabindex: '-1',
                name: this.pagerModule.getLocalizedLabel('previousPagerTooltip'),
                href: 'javascript:void(0);'
            }
        });
        prevPager.appendChild(this.PP);
        pagerContainer.appendChild(prevPager);
    }
    renderNextPagerSet(pagerContainer) {
        let nextPager = createElement('div');
        this.NP = createElement('a', {
            className: 'e-link e-np e-spacing',
            innerHTML: '...', attrs: {
                title: this.pagerModule.getLocalizedLabel('nextPagerTooltip'), role: 'link',
                'aria-label': this.pagerModule.getLocalizedLabel('nextPagerTooltip'),
                tabindex: '-1',
                name: this.pagerModule.getLocalizedLabel('nextPagerTooltip'),
                href: 'javascript:void(0);'
            }
        });
        nextPager.appendChild(this.NP);
        pagerContainer.appendChild(nextPager);
    }
    renderNextNLast(pagerContainer) {
        this.next = createElement('div', {
            className: 'e-next e-icons e-icon-next',
            attrs: {
                title: this.pagerModule.getLocalizedLabel('nextPageTooltip'),
                'aria-label': this.pagerModule.getLocalizedLabel('nextPageTooltip'),
                tabindex: '-1'
            }
        });
        this.last = createElement('div', {
            className: 'e-last e-icons e-icon-last',
            attrs: {
                title: this.pagerModule.getLocalizedLabel('lastPageTooltip'),
                'aria-label': this.pagerModule.getLocalizedLabel('lastPageTooltip'),
                tabindex: '-1'
            }
        });
        append([this.next, this.last], pagerContainer);
    }
    clickHandler(e) {
        let pagerObj = this.pagerModule;
        let target = e.target;
        pagerObj.previousPageNo = pagerObj.currentPage;
        if (!target.classList.contains('e-disable') && !isNullOrUndefined(target.getAttribute('index'))) {
            pagerObj.currentPage = parseInt(target.getAttribute('index'), 10);
            pagerObj.dataBind();
        }
        return false;
    }
    updateLinksHtml() {
        let pagerObj = this.pagerModule;
        let currentPageSet;
        let pageNo;
        pagerObj.currentPage = pagerObj.totalPages === 1 ? 1 : pagerObj.currentPage;
        if (pagerObj.currentPage > pagerObj.totalPages && pagerObj.totalPages) {
            pagerObj.currentPage = pagerObj.totalPages;
        }
        currentPageSet = parseInt((pagerObj.currentPage / pagerObj.pageCount).toString(), 10);
        if (pagerObj.currentPage % pagerObj.pageCount === 0 && currentPageSet > 0) {
            currentPageSet = currentPageSet - 1;
        }
        for (let i = 0; i < pagerObj.pageCount; i++) {
            pageNo = (currentPageSet * pagerObj.pageCount) + 1 + i;
            if (pageNo <= pagerObj.totalPages) {
                this.links[i].style.display = '';
                this.links[i].setAttribute('index', pageNo.toString());
                this.links[i].innerHTML = !pagerObj.customText ? pageNo.toString() : pagerObj.customText + pageNo;
                if (pagerObj.currentPage !== pageNo) {
                    this.links[i].classList.add('e-pager-default');
                }
                else {
                    this.links[i].classList.remove('e-pager-default');
                }
            }
            else {
                this.links[i].innerHTML = !pagerObj.customText ? pageNo.toString() : pagerObj.customText + pageNo;
                this.links[i].style.display = 'none';
            }
            classList(this.links[i], [], ['e-currentitem', 'e-active']);
        }
        this.first.setAttribute('index', '1');
        this.last.setAttribute('index', pagerObj.totalPages.toString());
        this.prev.setAttribute('index', (pagerObj.currentPage - 1).toString());
        this.next.setAttribute('index', (pagerObj.currentPage + 1).toString());
        this.pagerElement.querySelector('.e-mfirst').setAttribute('index', '1');
        this.pagerElement.querySelector('.e-mlast').setAttribute('index', pagerObj.totalPages.toString());
        this.pagerElement.querySelector('.e-mprev').setAttribute('index', (pagerObj.currentPage - 1).toString());
        this.pagerElement.querySelector('.e-mnext').setAttribute('index', (pagerObj.currentPage + 1).toString());
        this.PP.setAttribute('index', (parseInt(this.links[0].getAttribute('index'), 10) - pagerObj.pageCount).toString());
        this.NP.setAttribute('index', (parseInt(this.links[this.links.length - 1].getAttribute('index'), 10) + 1).toString());
    }
    updateStyles() {
        this.updateFirstNPrevStyles();
        this.updatePrevPagerSetStyles();
        this.updateNextPagerSetStyles();
        this.updateNextNLastStyles();
        if (this.links.length) {
            classList(this.links[(this.pagerModule.currentPage - 1) % this.pagerModule.pageCount], ['e-currentitem', 'e-active'], []);
        }
    }
    updateFirstNPrevStyles() {
        let firstPage = ['e-firstpage', 'e-pager-default'];
        let firstPageDisabled = ['e-firstpagedisabled', 'e-disable'];
        let prevPage = ['e-prevpage', 'e-pager-default'];
        let prevPageDisabled = ['e-prevpagedisabled', 'e-disable'];
        if (this.pagerModule.totalPages > 0 && this.pagerModule.currentPage > 1) {
            classList(this.prev, prevPage, prevPageDisabled);
            classList(this.first, firstPage, firstPageDisabled);
            classList(this.pagerElement.querySelector('.e-mfirst'), firstPage, firstPageDisabled);
            classList(this.pagerElement.querySelector('.e-mprev'), prevPage, prevPageDisabled);
        }
        else {
            classList(this.prev, prevPageDisabled, prevPage);
            classList(this.first, firstPageDisabled, firstPage);
            classList(this.pagerElement.querySelector('.e-mprev'), prevPageDisabled, prevPage);
            classList(this.pagerElement.querySelector('.e-mfirst'), firstPageDisabled, firstPage);
        }
    }
    updatePrevPagerSetStyles() {
        if (this.pagerModule.currentPage > this.pagerModule.pageCount) {
            classList(this.PP, ['e-numericitem', 'e-pager-default'], ['e-nextprevitemdisabled', 'e-disable']);
        }
        else {
            classList(this.PP, ['e-nextprevitemdisabled', 'e-disable'], ['e-numericitem', 'e-pager-default']);
        }
    }
    updateNextPagerSetStyles() {
        let pagerObj = this.pagerModule;
        let firstPage = this.links[0].innerHTML.replace(pagerObj.customText, '');
        if (!firstPage.length || !this.links.length || (parseInt(firstPage, 10) + pagerObj.pageCount > pagerObj.totalPages)) {
            classList(this.NP, ['e-nextprevitemdisabled', 'e-disable'], ['e-numericitem', 'e-pager-default']);
        }
        else {
            classList(this.NP, ['e-numericitem', 'e-pager-default'], ['e-nextprevitemdisabled', 'e-disable']);
        }
    }
    updateNextNLastStyles() {
        let lastPage = ['e-lastpage', 'e-pager-default'];
        let lastPageDisabled = ['e-lastpagedisabled', 'e-disable'];
        let nextPage = ['e-nextpage', 'e-pager-default'];
        let nextPageDisabled = ['e-nextpagedisabled', 'e-disable'];
        let pagerObj = this.pagerModule;
        if (pagerObj.currentPage === pagerObj.totalPages || pagerObj.totalRecordsCount === 0) {
            classList(this.last, lastPageDisabled, lastPage);
            classList(this.next, nextPageDisabled, nextPage);
            classList(this.pagerElement.querySelector('.e-mlast'), lastPageDisabled, lastPage);
            classList(this.pagerElement.querySelector('.e-mnext'), nextPageDisabled, nextPage);
        }
        else {
            classList(this.last, lastPage, lastPageDisabled);
            classList(this.next, nextPage, nextPageDisabled);
            classList(this.pagerElement.querySelector('.e-mlast'), lastPage, lastPageDisabled);
            classList(this.pagerElement.querySelector('.e-mnext'), nextPage, nextPageDisabled);
        }
    }
}

/**
 * `PagerMessage` module is used to display pager information.
 */
class PagerMessage {
    /**
     * Constructor for externalMessage module
     * @hidden
     */
    constructor(pagerModule) {
        this.pagerModule = pagerModule;
    }
    /**
     * The function is used to render pager message
     * @hidden
     */
    render() {
        let div = createElement('div', { className: 'e-parentmsgbar', attrs: { 'aria-label': 'Pager Information' } });
        this.pageNoMsgElem = createElement('span', { className: 'e-pagenomsg', styles: 'textalign:right' });
        this.pageCountMsgElem = createElement('span', { className: 'e-pagecountmsg', styles: 'textalign:right' });
        append([this.pageNoMsgElem, this.pageCountMsgElem], div);
        this.pagerModule.element.appendChild(div);
        this.refresh();
    }
    /**
     * Refreshes the pager information.
     */
    refresh() {
        let pagerObj = this.pagerModule;
        this.pageNoMsgElem.textContent = this.format(pagerObj.getLocalizedLabel('currentPageInfo'), [pagerObj.totalRecordsCount === 0 ? 0 :
                pagerObj.currentPage, pagerObj.totalPages || 0]) + ' ';
        this.pageCountMsgElem.textContent = this.format(pagerObj.getLocalizedLabel('totalItemsInfo'), [pagerObj.totalRecordsCount || 0]);
        this.pageNoMsgElem.parentElement.setAttribute('aria-label', this.pageNoMsgElem.textContent + this.pageCountMsgElem.textContent);
    }
    /**
     * Hides the Pager information.
     */
    hideMessage() {
        if (this.pageNoMsgElem) {
            this.pageNoMsgElem.style.display = 'none';
        }
        if (this.pageCountMsgElem) {
            this.pageCountMsgElem.style.display = 'none';
        }
    }
    /**
     * Shows the Pager information.
     */
    showMessage() {
        if (!this.pageNoMsgElem) {
            this.render();
        }
        this.pageNoMsgElem.style.display = '';
        this.pageCountMsgElem.style.display = '';
    }
    /**
     * To destroy the PagerMessage
     * @method destroy
     * @return {void}
     * @hidden
     */
    destroy() {
        //destroy
    }
    format(str, args) {
        let regx;
        for (let i = 0; i < args.length; i++) {
            regx = new RegExp('\\{' + (i) + '\\}', 'gm');
            str = str.replace(regx, args[i].toString());
        }
        return str;
    }
}

var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Represents the `Pager` component.
 * ```html
 * <div id="pager"/>
 * ```
 * ```typescript
 * <script>
 *   var pagerObj = new Pager({ totalRecordsCount: 50, pageSize:10 });
 *   pagerObj.appendTo("#pager");
 * </script>
 * ```
 */
let Pager = class Pager extends Component {
    /**
     * Constructor for creating the component.
     * @hidden
     */
    constructor(options, element) {
        super(options, element);
        this.defaultConstants = {
            currentPageInfo: '{0} of {1} pages',
            totalItemsInfo: '({0} items)',
            firstPageTooltip: 'Go to first page',
            lastPageTooltip: 'Go to last page',
            nextPageTooltip: 'Go to next page',
            previousPageTooltip: 'Go to previous page',
            nextPagerTooltip: 'Go to next pager',
            previousPagerTooltip: 'Go to previous pager',
            pagerDropDown: 'Items per page'
        };
        /**
         * `containerModule` is used to manipulate numeric container behavior of Pager.
         */
        this.containerModule = new NumericContainer(this);
        /**
         * `pagerMessageModule` is used to manipulate pager message of Pager.
         */
        this.pagerMessageModule = new PagerMessage(this);
    }
    /**
     * To provide the array of modules needed for component rendering
     * @hidden
     */
    requiredModules() {
        let modules = [];
        if (this.enableExternalMessage) {
            modules.push({
                member: 'externalMessage',
                args: [this]
            });
        }
        if (this.checkpagesizes()) {
            modules.push({
                member: 'pagerdropdown',
                args: [this]
            });
        }
        return modules;
    }
    /**
     * Initialize the event handler
     * @hidden
     */
    preRender() {
        //preRender
    }
    /**
     * To Initialize the component rendering
     */
    render() {
        if (this.template) {
            this.pagerTemplate();
        }
        else {
            this.initLocalization();
            this.updateRTL();
            this.totalRecordsCount = this.totalRecordsCount || 0;
            this.renderFirstPrevDivForDevice();
            this.containerModule.render();
            if (this.enablePagerMessage) {
                this.pagerMessageModule.render();
            }
            this.renderNextLastDivForDevice();
            if (this.checkpagesizes()) {
                this.pagerdropdownModule.render();
            }
            this.addAriaLabel();
            if (this.enableExternalMessage && this.externalMessageModule) {
                this.externalMessageModule.render();
            }
            this.refresh();
            this.trigger('created', { 'currentPage': this.currentPage, 'totalRecordsCount': this.totalRecordsCount });
        }
    }
    /**
     * Get the properties to be maintained in the persisted state.
     * @hidden
     */
    getPersistData() {
        let keyEntity = ['currentPage', 'pageSize'];
        return this.addOnPersist(keyEntity);
    }
    /**
     * To destroy the Pager component.
     * @method destroy
     * @return {void}
     */
    destroy() {
        super.destroy();
        this.containerModule.destroy();
        this.pagerMessageModule.destroy();
        this.element.innerHTML = '';
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'pager';
    }
    /**
     * Called internally if any of the property value changed.
     * @hidden
     */
    onPropertyChanged(newProp, oldProp) {
        if (this.isDestroyed) {
            return;
        }
        if (newProp.pageCount !== oldProp.pageCount) {
            this.containerModule.refreshNumericLinks();
            this.containerModule.refresh();
        }
        for (let prop of Object.keys(newProp)) {
            switch (prop) {
                case 'currentPage':
                    if (this.checkGoToPage(newProp.currentPage, oldProp.currentPage)) {
                        this.currentPageChanged();
                    }
                    break;
                case 'pageSize':
                case 'totalRecordsCount':
                case 'customText':
                    this.refresh();
                    break;
                case 'pageSizes':
                    if (this.checkpagesizes()) {
                        this.pagerdropdownModule.destroy();
                        this.pagerdropdownModule.render();
                    }
                    this.refresh();
                    break;
                case 'template':
                    this.templateFn = this.compile(this.template);
                    this.refresh();
                    break;
                case 'locale':
                    this.initLocalization();
                    this.refresh();
                    break;
                case 'enableExternalMessage':
                    if (this.enableExternalMessage) {
                        this.externalMessageModule.render();
                    }
                    break;
                case 'externalMessage':
                    if (this.externalMessageModule) {
                        this.externalMessageModule.refresh();
                    }
                    break;
                case 'enableRtl':
                    this.updateRTL();
                    break;
                case 'enablePagerMessage':
                    if (this.enablePagerMessage) {
                        this.pagerMessageModule.showMessage();
                    }
                    else {
                        this.pagerMessageModule.hideMessage();
                    }
                    break;
            }
        }
    }
    /**
     * Gets the localized label by locale keyword.
     * @param  {string} key
     * @return {string}
     */
    getLocalizedLabel(key) {
        return this.localeObj.getConstant(key);
    }
    /**
     * Navigate to target page by given number.
     * @param  {number} pageNo - Defines page number.
     * @return {void}
     */
    goToPage(pageNo) {
        if (this.checkGoToPage(pageNo)) {
            this.currentPage = pageNo;
            this.dataBind();
        }
    }
    checkpagesizes() {
        if (this.pageSizes === true || this.pageSizes.length) {
            return true;
        }
        return false;
    }
    checkGoToPage(newPageNo, oldPageNo) {
        if (newPageNo !== this.currentPage) {
            this.previousPageNo = this.currentPage;
        }
        if (!isNullOrUndefined(oldPageNo)) {
            this.previousPageNo = oldPageNo;
        }
        if (this.previousPageNo !== newPageNo && (newPageNo >= 1 && newPageNo <= this.totalPages)) {
            return true;
        }
        return false;
    }
    currentPageChanged() {
        if (this.enableQueryString) {
            this.updateQueryString(this.currentPage);
        }
        let args = { currentPage: this.currentPage, cancel: false };
        this.trigger('click', args);
        if (!args.cancel) {
            this.refresh();
        }
    }
    pagerTemplate() {
        let result;
        this.element.classList.add('e-pagertemplate');
        this.compile(this.template);
        let data = {
            currentPage: this.currentPage, pageSize: this.pageSize, pageCount: this.pageCount,
            totalRecordsCount: this.totalRecordsCount, totalPages: this.totalPages
        };
        result = this.getPagerTemplate()(data);
        appendChildren(this.element, result);
    }
    /** @hidden */
    updateTotalPages() {
        this.totalPages = (this.totalRecordsCount % this.pageSize === 0) ? (this.totalRecordsCount / this.pageSize) :
            (parseInt((this.totalRecordsCount / this.pageSize).toString(), 10) + 1);
    }
    /** @hidden */
    getPagerTemplate() {
        return this.templateFn;
    }
    compile(template) {
        if (template) {
            try {
                if (document.querySelectorAll(template).length) {
                    this.templateFn = compile(document.querySelector(template).innerHTML.trim());
                }
            }
            catch (e) {
                this.templateFn = compile(template);
            }
        }
        return undefined;
    }
    /**
     * Refreshes page count, pager information and external message.
     * @return {void}
     */
    refresh() {
        if (this.template) {
            this.element.innerHTML = '';
            this.updateTotalPages();
            this.pagerTemplate();
        }
        else {
            this.updateRTL();
            this.containerModule.refresh();
            if (this.enablePagerMessage) {
                this.pagerMessageModule.refresh();
            }
            if (this.enableExternalMessage && this.externalMessageModule) {
                this.externalMessageModule.refresh();
            }
        }
    }
    updateRTL() {
        if (this.enableRtl) {
            this.element.classList.add('e-rtl');
        }
        else {
            this.element.classList.remove('e-rtl');
        }
    }
    initLocalization() {
        this.localeObj = new L10n(this.getModuleName(), this.defaultConstants, this.locale);
    }
    updateQueryString(value) {
        let updatedUrl = this.getUpdatedURL(window.location.href, 'page', value.toString());
        window.history.pushState({ path: updatedUrl }, '', updatedUrl);
    }
    getUpdatedURL(uri, key, value) {
        let regx = new RegExp('([?|&])' + key + '=.*?(&|#|$)', 'i');
        if (uri.match(regx)) {
            return uri.replace(regx, '$1' + key + '=' + value + '$2');
        }
        else {
            let hash = '';
            if (uri.indexOf('#') !== -1) {
                hash = uri.replace(/.*#/, '#');
                uri = uri.replace(/#.*/, '');
            }
            return uri + (uri.indexOf('?') !== -1 ? '&' : '?') + key + '=' + value + hash;
        }
    }
    renderFirstPrevDivForDevice() {
        this.element.appendChild(createElement('div', {
            className: 'e-mfirst e-icons e-icon-first',
            attrs: { title: this.getLocalizedLabel('firstPageTooltip'), tabindex: '-1' }
        }));
        this.element.appendChild(createElement('div', {
            className: 'e-mprev e-icons e-icon-prev',
            attrs: { title: this.getLocalizedLabel('previousPageTooltip'), tabindex: '-1' }
        }));
    }
    renderNextLastDivForDevice() {
        this.element.appendChild(createElement('div', {
            className: 'e-mnext e-icons e-icon-next',
            attrs: { title: this.getLocalizedLabel('nextPageTooltip'), tabindex: '-1' }
        }));
        this.element.appendChild(createElement('div', {
            className: 'e-mlast e-icons e-icon-last',
            attrs: { title: this.getLocalizedLabel('lastPageTooltip'), tabindex: '-1' }
        }));
    }
    addAriaLabel() {
        let classList$$1 = ['.e-mfirst', '.e-mprev', '.e-mnext', '.e-mlast'];
        if (!Browser.isDevice) {
            classList$$1.forEach((value) => {
                let element = this.element.querySelector(value);
                element.setAttribute('aria-label', element.getAttribute('title'));
            });
        }
    }
};
__decorate$3([
    Property(false)
], Pager.prototype, "enableQueryString", void 0);
__decorate$3([
    Property(false)
], Pager.prototype, "enableExternalMessage", void 0);
__decorate$3([
    Property(true)
], Pager.prototype, "enablePagerMessage", void 0);
__decorate$3([
    Property(12)
], Pager.prototype, "pageSize", void 0);
__decorate$3([
    Property(10)
], Pager.prototype, "pageCount", void 0);
__decorate$3([
    Property(1)
], Pager.prototype, "currentPage", void 0);
__decorate$3([
    Property()
], Pager.prototype, "totalRecordsCount", void 0);
__decorate$3([
    Property()
], Pager.prototype, "externalMessage", void 0);
__decorate$3([
    Property(false)
], Pager.prototype, "pageSizes", void 0);
__decorate$3([
    Property()
], Pager.prototype, "template", void 0);
__decorate$3([
    Property('')
], Pager.prototype, "customText", void 0);
__decorate$3([
    Event()
], Pager.prototype, "click", void 0);
__decorate$3([
    Event()
], Pager.prototype, "dropDownChanged", void 0);
__decorate$3([
    Event()
], Pager.prototype, "created", void 0);
Pager = __decorate$3([
    NotifyPropertyChanges
], Pager);

/**
 * `PagerDropDown` module handles selected pageSize from DropDownList.
 */
class PagerDropDown {
    /**
     * Constructor for pager module
     * @hidden
     */
    constructor(pagerModule) {
        this.pagerModule = pagerModule;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     * @hidden
     */
    getModuleName() {
        return 'pagerdropdown';
    }
    /**
     * The function is used to render pager dropdown
     * @hidden
     */
    render() {
        let pagerObj = this.pagerModule;
        this.pagerDropDownDiv = createElement('div', { className: 'e-pagesizes' });
        let dropDownDiv = createElement('div', { className: 'e-pagerdropdown' });
        let defaultTextDiv = createElement('div', { className: 'e-pagerconstant' });
        let input = createElement('input', { attrs: { type: 'text', tabindex: '1' } });
        this.pagerCons = createElement('span', { className: 'e-constant', innerHTML: this.pagerModule.getLocalizedLabel('pagerDropDown') });
        dropDownDiv.appendChild(input);
        defaultTextDiv.appendChild(this.pagerCons);
        this.pagerDropDownDiv.appendChild(dropDownDiv);
        this.pagerDropDownDiv.appendChild(defaultTextDiv);
        this.pagerModule.element.appendChild(this.pagerDropDownDiv);
        let pageSizesModule = this.pagerModule.pageSizes;
        let pageSizesArray = (pageSizesModule.length ? pageSizesModule : [5, 10, 12, 20]);
        let defaultValue = (pageSizesArray).indexOf(this.pagerModule.pageSize) > -1 ? this.pagerModule.pageSize : pageSizesArray[0];
        this.dropDownListObject = new DropDownList({
            dataSource: pageSizesArray,
            value: defaultValue,
            change: this.onChange.bind(this)
        });
        this.dropDownListObject.appendTo(input);
        pagerObj.pageSize = defaultValue;
        pagerObj.dataBind();
        pagerObj.trigger('dropDownChanged', { pageSize: defaultValue });
    }
    /**
     * For internal use only - Get the pagesize.
     * @private
     * @hidden
     */
    onChange(e) {
        this.pagerModule.pageSize = this.dropDownListObject.value;
        this.pagerModule.dataBind();
        this.pagerModule.trigger('dropDownChanged', { pageSize: this.dropDownListObject.value });
    }
    /**
     * To destroy the Pagerdropdown
     * @method destroy
     * @return {void}
     * @hidden
     */
    destroy(args) {
        if (this.dropDownListObject && !this.dropDownListObject.isDestroyed) {
            this.dropDownListObject.destroy();
            remove(this.pagerDropDownDiv);
        }
    }
}

/**
 * `ExternalMessage` module is used to display user provided message.
 */
class ExternalMessage {
    /**
     * Constructor for externalMessage module
     * @param  {Pager} pagerModule?
     * @returns defaultType
     * @hidden
     */
    constructor(pagerModule) {
        this.pagerModule = pagerModule;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'externalMessage';
    }
    /**
     * The function is used to render pager externalMessage
     * @hidden
     */
    render() {
        this.element = createElement('div', { className: 'e-pagerexternalmsg', attrs: { 'aria-label': 'Pager external message' } });
        this.pagerModule.element.appendChild(this.element);
        this.refresh();
    }
    /**
     * Refreshes the external message of Pager.
     */
    refresh() {
        if (this.pagerModule.externalMessage && this.pagerModule.externalMessage.toString().length) {
            this.showMessage();
            this.element.innerHTML = this.pagerModule.externalMessage;
        }
        else {
            this.hideMessage();
        }
    }
    /**
     * Hides the external message of Pager.
     */
    hideMessage() {
        this.element.style.display = 'none';
    }
    /**
     * Shows the external message of the Pager.
     */
    showMessage() {
        this.element.style.display = '';
    }
    /**
     * To destroy the PagerMessage
     * @method destroy
     * @return {void}
     * @hidden
     */
    destroy() {
        remove(this.element);
    }
}

Pager.Inject(ExternalMessage, PagerDropDown);
/**
 * The `Page` module is used to render pager and handle paging action.
 */
class Page {
    /**
     * Constructor for the Grid paging module
     * @hidden
     */
    constructor(parent, pageSettings) {
        this.parent = parent;
        this.pageSettings = pageSettings;
        this.addEventListener();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'pager';
    }
    /**
     * The function used to render pager from grid pageSettings
     * @return {void}
     * @hidden
     */
    render() {
        let gObj = this.parent;
        let pagerObj;
        this.pagerDestroy();
        if (!isNullOrUndefined(this.parent.pagerTemplate)) {
            this.pageSettings.template = this.parent.pagerTemplate;
        }
        this.element = createElement('div', { className: 'e-gridpager' });
        pagerObj = extend$1({}, extend({}, getActualProperties(this.pageSettings)), {
            click: this.clickHandler.bind(this),
            dropDownChanged: this.onSelect.bind(this),
            enableRtl: gObj.enableRtl, locale: gObj.locale,
            created: this.addAriaAttr.bind(this)
        }, ['parentObj', 'propName']);
        this.pagerObj = new Pager(pagerObj);
    }
    onSelect(e) {
        this.pageSettings.pageSize = e.pageSize;
        this.pageSettings.currentPage = 1;
    }
    addAriaAttr() {
        if (!(this.pageSettings.template)) {
            let numericContainerNew = createElement('div', { className: 'e-numericcontainer' });
            let pagerContainer = this.element.querySelector('.e-pagercontainer');
            let frag = document.createDocumentFragment();
            let numericContainer = this.element.querySelector('.e-numericcontainer');
            let links = numericContainer.querySelectorAll('a');
            for (let i = 0; i < links.length; i++) {
                if (this.parent.getContentTable()) {
                    links[i].setAttribute('aria-owns', this.parent.getContentTable().id);
                    let numericContainerDiv = createElement('div');
                    numericContainerDiv.appendChild(links[i]);
                    frag.appendChild(numericContainerDiv);
                }
            }
            numericContainerNew.appendChild(frag);
            pagerContainer.replaceChild(numericContainerNew, numericContainer);
            let classList$$1 = ['.e-mfirst', '.e-mprev', '.e-first', '.e-prev', '.e-next', '.e-last', '.e-mnext', '.e-mlast'];
            classList$$1.forEach((value) => {
                let element = this.element.querySelector(value);
                if (this.parent.getContentTable()) {
                    element.setAttribute('aria-owns', this.parent.getContentTable().id);
                }
            });
        }
    }
    dataReady(e) {
        this.updateModel(e);
    }
    /**
     * Refreshes the page count, pager information, and external message.
     * @return {void}
     */
    refresh() {
        this.pagerObj.refresh();
    }
    /**
     * Navigates to the target page according to the given number.
     * @param  {number} pageNo - Defines the page number to navigate.
     * @return {void}
     */
    goToPage(pageNo) {
        this.pagerObj.goToPage(pageNo);
    }
    /**
     * The function used to update pageSettings model
     * @return {void}
     * @hidden
     */
    updateModel(e) {
        this.parent.pageSettings.totalRecordsCount = e.count;
        this.parent.dataBind();
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        this.parent.trigger(actionComplete, extend(e, {
            currentPage: this.parent.pageSettings.currentPage, requestType: 'paging',
            type: actionComplete
        }));
    }
    /**
     * @hidden
     */
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        let newProp = e.properties;
        for (let prop of Object.keys(newProp)) {
            this.pagerObj[prop] = newProp[prop];
        }
        this.pagerObj.dataBind();
    }
    clickHandler(e) {
        let gObj = this.parent;
        if (this.isForceCancel || isActionPrevent(gObj)) {
            if (!this.isForceCancel) {
                gObj.notify(preventBatch, { instance: this, handler: this.goToPage, arg1: e.currentPage });
                this.isForceCancel = true;
                this.pagerObj.currentPage = gObj.pageSettings.currentPage;
                this.pagerObj.dataBind();
            }
            else {
                this.isForceCancel = false;
            }
            e.cancel = true;
            return;
        }
        let prevPage = this.pageSettings.currentPage;
        this.pageSettings.currentPage = e.currentPage;
        this.parent.notify(modelChanged, {
            requestType: 'paging',
            previousPage: prevPage,
            currentPage: e.currentPage,
            type: actionBegin
        });
    }
    keyPressHandler(e) {
        if (e.action in keyActions) {
            e.preventDefault();
            this.element.querySelector(keyActions[e.action]).click();
        }
    }
    /**
     * Defines the text of the external message.
     * @param  {string} message - Defines the message to update.
     * @return {void}
     */
    updateExternalMessage(message) {
        if (!this.pagerObj.enableExternalMessage) {
            this.pagerObj.enableExternalMessage = true;
            this.pagerObj.dataBind();
        }
        this.pagerObj.externalMessage = message;
        this.pagerObj.dataBind();
    }
    appendToElement(e) {
        this.parent.element.appendChild(this.element);
        this.parent.setGridPager(this.element);
        this.pagerObj.appendTo(this.element);
    }
    enableAfterRender(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.render();
            this.appendToElement();
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        this.handlers = {
            load: this.render,
            end: this.appendToElement,
            ready: this.dataReady,
            complete: this.onActionComplete,
            updateLayout: this.enableAfterRender,
            inboundChange: this.onPropertyChanged,
            keyPress: this.keyPressHandler
        };
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialLoad, this.handlers.load, this);
        this.parent.on(initialEnd, this.handlers.end, this); //For initial rendering
        this.parent.on(dataReady, this.handlers.ready, this);
        this.parent.on(pageComplete, this.handlers.complete, this);
        this.parent.on(uiUpdate, this.handlers.updateLayout, this);
        this.parent.on(inBoundModelChanged, this.handlers.inboundChange, this);
        this.parent.on(keyPressed, this.handlers.keyPress, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialLoad, this.handlers.load);
        this.parent.off(initialEnd, this.handlers.end); //For initial rendering
        this.parent.off(dataReady, this.handlers.ready);
        this.parent.off(pageComplete, this.handlers.complete);
        this.parent.off(uiUpdate, this.handlers.updateLayout);
        this.parent.off(inBoundModelChanged, this.handlers.inboundChange);
        this.parent.off(keyPressed, this.handlers.keyPress);
    }
    /**
     * To destroy the pager
     * @return {void}
     * @hidden
     */
    destroy() {
        this.removeEventListener();
        this.pagerDestroy();
    }
    pagerDestroy() {
        if (this.pagerObj && !this.pagerObj.isDestroyed) {
            this.pagerObj.destroy();
            remove(this.element);
        }
    }
}
/**
 * @hidden
 */
const keyActions = {
    pageUp: '.e-prev',
    pageDown: '.e-next',
    ctrlAltPageDown: '.e-last',
    ctrlAltPageUp: '.e-first',
    altPageUp: '.e-pp',
    altPageDown: '.e-np'
};

/**
 * FilterCellRenderer class which responsible for building filter cell.
 * @hidden
 */
class FilterCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TH', { className: 'e-filterbarcell' });
    }
    /**
     * Function to return the wrapper for the TH content.
     * @returns string
     */
    getGui() {
        return createElement('div');
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Cell} cell
     * @param  {Object} data
     */
    render(cell, data) {
        let tr = this.parent.element.querySelector('.e-filterbar');
        let node = this.element.cloneNode();
        let innerDIV = this.getGui();
        let input;
        let column = cell.column;
        tr.appendChild(node);
        if (column.type !== 'checkbox') {
            if ((isNullOrUndefined(column.allowFiltering) || column.allowFiltering) && !isNullOrUndefined(column.filterBarTemplate)) {
                node.classList.add('e-fltrtemp');
                attributes(innerDIV, {
                    'class': 'e-fltrtempdiv'
                });
                if (isNullOrUndefined(column.filterBarTemplate.create)) {
                    input = createElement('input', {
                        id: column.field + '_filterBarcell', className: 'e-filterUi_input e-filtertext e-fltrTemp',
                        attrs: { type: 'search', title: column.headerText }
                    });
                    innerDIV.appendChild(input);
                }
                else {
                    let args = { column: column, node: Element };
                    let temp = column.filterBarTemplate.create;
                    if (typeof temp === 'string') {
                        temp = getValue(temp, window);
                    }
                    input = temp(args);
                    if (typeof input === 'string') {
                        let div = createElement('div');
                        div.innerHTML = input;
                        input = div.firstChild;
                    }
                    attributes(innerDIV, {
                        class: 'e-filterUi_input e-filtertext e-fltrTemp',
                        title: column.headerText,
                        id: column.field + '_filterBarcell',
                    });
                    innerDIV.appendChild(input);
                }
            }
            else {
                attributes(innerDIV, {
                    'class': 'e-filterdiv e-fltrinputdiv'
                });
                input = createElement('input', {
                    id: column.field + '_filterBarcell', className: 'e-filtertext',
                    attrs: {
                        type: 'search', title: column.headerText + cell.attributes.title,
                        value: data[cell.column.field] ? data[cell.column.field] : '', role: 'search'
                    }
                });
                innerDIV.appendChild(input);
                Input.createInput({
                    element: input, floatLabelType: 'Never',
                    properties: {
                        enableRtl: this.parent.enableRtl, showClearButton: true
                    }
                });
            }
            //TODO: apply intial filtering
            if (column.allowFiltering === false || column.field === '' || isNullOrUndefined(column.field)) {
                input.setAttribute('disabled', 'true');
                input.classList.add('e-disable');
            }
            if (!column.visible) {
                node.classList.add('e-hide');
            }
            this.appendHtml(node, innerDIV);
            if ((isNullOrUndefined(column.allowFiltering) || column.allowFiltering) && !isNullOrUndefined(column.filterBarTemplate)) {
                let templateWrite = column.filterBarTemplate.write;
                let args = { element: input, column: column };
                if (typeof templateWrite === 'string') {
                    templateWrite = getValue(templateWrite, window);
                }
                templateWrite.call(this, args);
            }
        }
        return node;
    }
    /**
     * Function to specifies how the result content to be placed in the cell.
     * @param  {Element} node
     * @param  {string|Element} innerHTML
     * @returns Element
     */
    appendHtml(node, innerHtml) {
        node.appendChild(innerHtml);
        return node;
    }
}

/**
 * `filter operators` render boolean column.
 * @hidden
 */
class FlMenuOptrUI {
    constructor(parent, customFltrOperators, serviceLocator, filterSettings) {
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.filterSettings = filterSettings;
        this.customFilterOperators = customFltrOperators;
    }
    /**
     * @hidden
     */
    renderOperatorUI(dlgConetntEle, target, column, dlgObj) {
        this.dialogObj = dlgObj;
        let optr = column.type + 'Operator';
        this.optrData = this.customOptr = (!isNullOrUndefined(this.parent.filterSettings.operators) &&
            !isNullOrUndefined(this.parent.filterSettings.operators[optr])) ?
            this.parent.filterSettings.operators[optr] : this.customFilterOperators[optr];
        let dropDatasource = this.customOptr;
        let selectedValue = this.dropSelectedVal(column, optr);
        let optrDiv = createElement('div', { className: 'e-flm_optrdiv' });
        dlgConetntEle.appendChild(optrDiv);
        let optrInput = createElement('input', { id: column.uid + '-floptr' });
        optrDiv.appendChild(optrInput);
        this.dropOptr = new DropDownList({
            dataSource: dropDatasource,
            fields: { text: 'text', value: 'value' },
            open: this.dropDownOpen.bind(this),
            text: selectedValue
        });
        this.dropOptr.appendTo('#' + column.uid + '-floptr');
    }
    dropDownOpen(args) {
        args.popup.element.style.zIndex = (this.dialogObj.zIndex + 1).toString();
    }
    dropSelectedVal(col, optr) {
        let selValue = '';
        let columns = this.parent.filterSettings.columns;
        for (let column of columns) {
            if (col.field === column.field) {
                let selectedField = new DataManager(this.optrData).executeLocal(new Query().where('value', 'equal', column.operator));
                selValue = !isNullOrUndefined(selectedField[0]) ? selectedField[0].text : '';
            }
        }
        if (selValue === '') {
            selValue = this.optrData[0].text;
        }
        return selValue;
    }
    /**
     * @hidden
     */
    getFlOperator() {
        return this.dropOptr.value;
    }
}

/**
 * `string filterui` render string column.
 * @hidden
 */
class StringFilterUI {
    constructor(parent, serviceLocator, filterSettings) {
        this.parent = parent;
        this.serLocator = serviceLocator;
        this.filterSettings = filterSettings;
    }
    create(args) {
        this.instance = createElement('input', { className: 'e-flmenu-input', id: 'strui-' + args.column.uid });
        args.target.appendChild(this.instance);
        this.dialogObj = args.dialogObj;
        this.actObj = new AutoComplete(this.getAutoCompleteOptions(args));
        this.actObj.appendTo(this.instance);
    }
    getAutoCompleteOptions(args) {
        let isForeignColumn = args.column.isForeignColumn();
        let dataSource = isForeignColumn ? args.column.dataSource : this.parent.dataSource;
        let fields = { value: isForeignColumn ? args.column.foreignKeyValue : args.column.field };
        return {
            dataSource: dataSource instanceof DataManager ? dataSource : new DataManager(dataSource),
            fields: fields,
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            sortOrder: 'Ascending',
            open: this.openPopup.bind(this),
            cssClass: 'e-popup-flmenu',
            focus: () => {
                this.actObj.filterType = args.getOptrInstance.getFlOperator();
            },
            autofill: true,
            placeholder: args.localizeText.getConstant('EnterValue'),
            actionComplete: (e) => {
                e.result = e.result.filter((obj, index, arr) => {
                    return arr.map((mapObj) => {
                        return mapObj[this.actObj.fields.value];
                    }).indexOf(obj[this.actObj.fields.value]) === index;
                });
            }
        };
    }
    write(args) {
        let columns = this.filterSettings.columns;
        if (args.filteredValue !== '') {
            let struiObj = document.querySelector('#strui-' + args.column.uid).ej2_instances[0];
            struiObj.value = args.filteredValue;
        }
    }
    read(element, column, filterOptr, filterObj) {
        let actuiObj = document.querySelector('#strui-' + column.uid).ej2_instances[0];
        if (Browser.isDevice) {
            actuiObj.hidePopup();
            actuiObj.focusOut();
        }
        let filterValue = actuiObj.value;
        if (isNullOrUndefined(filterValue) || filterValue === '') {
            filterValue = null;
        }
        filterObj.filterByColumn(column.field, filterOptr, filterValue, 'and', false);
    }
    openPopup(args) {
        getZIndexCalcualtion(args, this.dialogObj);
    }
}

/**
 * `numberfilterui` render number column.
 * @hidden
 */
class NumberFilterUI {
    constructor(parent, serviceLocator, filterSettings) {
        this.filterSettings = filterSettings;
        this.parent = parent;
        this.serviceLocator = serviceLocator;
    }
    create(args) {
        this.instance = createElement('input', { className: 'e-flmenu-input', id: 'numberui-' + args.column.uid });
        args.target.appendChild(this.instance);
        this.numericTxtObj = new NumericTextBox({
            format: args.column.format,
            locale: this.parent.locale,
            cssClass: 'e-popup-flmenu',
            placeholder: args.localizeText.getConstant('EnterValue'),
            enableRtl: this.parent.enableRtl,
        });
        this.numericTxtObj.appendTo(this.instance);
    }
    write(args) {
        let numberuiObj = document.querySelector('#numberui-' + args.column.uid).ej2_instances[0];
        numberuiObj.value = args.filteredValue;
    }
    read(element, column, filterOptr, filterObj) {
        let numberuiObj = document.querySelector('#numberui-' + column.uid).ej2_instances[0];
        let filterValue = numberuiObj.value;
        filterObj.filterByColumn(column.field, filterOptr, filterValue, 'and', true);
    }
}

/**
 * `boolfilterui` render boolean column.
 * @hidden
 */
class BooleanFilterUI {
    constructor(parent, serviceLocator, filterSettings) {
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.filterSettings = filterSettings;
    }
    create(args) {
        let fields = args.column.field;
        this.elem = createElement('input', { className: 'e-flmenu-input', id: 'bool-ui-' + args.column.uid });
        args.target.appendChild(this.elem);
        this.dialogObj = args.dialogObj;
        this.dropInstance = new DropDownList({
            dataSource: this.parent.dataSource instanceof DataManager ?
                this.parent.dataSource : new DataManager(this.parent.dataSource),
            query: new Query().select(args.column.field),
            fields: { text: args.column.field, value: args.column.field },
            placeholder: args.localizeText.getConstant('SelectValue'),
            cssClass: 'e-popup-flmenu',
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            open: this.openPopup.bind(this),
            actionComplete: (e) => {
                e.result = DataUtil.distinct(e.result, fields, true);
            }
        });
        this.dropInstance.appendTo(this.elem);
    }
    write(args) {
        let drpuiObj = document.querySelector('#bool-ui-' + args.column.uid).ej2_instances[0];
        drpuiObj.text = !isNullOrUndefined(args.filteredValue) ? args.filteredValue : '';
    }
    read(element, column, filterOptr, filterObj) {
        let drpuiObj = document.querySelector('#bool-ui-' + column.uid).ej2_instances[0];
        let filterValue = drpuiObj.value;
        filterObj.filterByColumn(column.field, filterOptr, filterValue, 'and', false);
    }
    openPopup(args) {
        getZIndexCalcualtion(args, this.dialogObj);
    }
}

/**
 * `datefilterui` render date column.
 * @hidden
 */
class DateFilterUI {
    constructor(parent, serviceLocator, filterSettings) {
        this.parent = parent;
        this.locator = serviceLocator;
        this.fltrSettings = filterSettings;
    }
    create(args) {
        let intl = new Internationalization();
        let colFormat = args.column.format;
        let format = intl.getDatePattern({ type: 'date', skeleton: colFormat }, false);
        this.dialogObj = args.dialogObj;
        this.inputElem = createElement('input', { className: 'e-flmenu-input', id: 'dateui-' + args.column.uid });
        args.target.appendChild(this.inputElem);
        this.datePickerObj = new DatePicker({
            format: format,
            cssClass: 'e-popup-flmenu',
            placeholder: args.localizeText.getConstant('ChooseDate'),
            width: '100%',
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            open: this.openPopup.bind(this),
        });
        this.datePickerObj.appendTo(this.inputElem);
    }
    write(args) {
        let columns = this.fltrSettings.columns;
        let dateuiObj = document.querySelector('#dateui-' + args.column.uid).ej2_instances[0];
        dateuiObj.value = !isNullOrUndefined(args.filteredValue) ? new Date(args.filteredValue) : null;
    }
    read(element, column, filterOptr, filterObj) {
        let dateuiObj = document.querySelector('#dateui-' + column.uid).ej2_instances[0];
        let filterValue = dateuiObj.value;
        filterValue = isNullOrUndefined(filterValue) ? null : filterValue;
        filterObj.filterByColumn(column.field, filterOptr, filterValue, 'and', true);
    }
    openPopup(args) {
        args.popup.element.style.zIndex = (this.dialogObj.zIndex + 1).toString();
    }
}

/**
 * `filter menu` render boolean column.
 * @hidden
 */
class FilterMenuRenderer {
    constructor(parent, filterSettings, serviceLocator, customFltrOperators, fltrObj) {
        this.isDialogOpen = false;
        this.colTypes = {
            'string': StringFilterUI, 'number': NumberFilterUI, 'date': DateFilterUI, 'boolean': BooleanFilterUI, 'datetime': DateFilterUI
        };
        this.parent = parent;
        this.filterSettings = filterSettings;
        this.serviceLocator = serviceLocator;
        this.customFilterOperators = customFltrOperators;
        this.filterObj = fltrObj;
        this.flMuiObj = new FlMenuOptrUI(this.parent, this.customFilterOperators, this.serviceLocator);
        this.l10n = this.serviceLocator.getService('localization');
    }
    openDialog(args) {
        this.col = this.parent.getColumnByField(args.field);
        if (isNullOrUndefined(this.col.filter) || (isNullOrUndefined(this.col.filter.type) || this.col.filter.type === 'Menu')) {
            this.renderDlgContent(args.target, this.col);
        }
    }
    closeDialog() {
        let elem = document.getElementById(this.dlgObj.element.id);
        if (this.dlgObj && !this.dlgObj.isDestroyed && elem) {
            this.parent.notify(filterMenuClose, { field: this.col.field });
            this.isDialogOpen = false;
            this.dlgObj.destroy();
            remove(elem);
        }
    }
    renderDlgContent(target, column) {
        let args = {
            requestType: filterBeforeOpen, filterModel: this,
            columnName: column.field, columnType: column.type
        };
        this.parent.trigger(actionBegin, args);
        let mainDiv = createElement('div', { className: 'e-flmenu-maindiv', id: column.uid + '-flmenu' });
        this.dlgDiv = createElement('div', { className: 'e-flmenu', id: column.uid + '-flmdlg' });
        this.parent.element.appendChild(this.dlgDiv);
        this.dlgObj = new Dialog({
            showCloseIcon: false,
            closeOnEscape: false,
            locale: this.parent.locale,
            visible: false,
            enableRtl: this.parent.enableRtl,
            created: this.dialogCreated.bind(this, target, column),
            position: this.parent.element.classList.contains('e-device') ? { X: 'center', Y: 'center' } : { X: '', Y: '' },
            target: this.parent.element.classList.contains('e-device') ? document.body : this.parent.element,
            buttons: [{
                    click: this.filterBtnClick.bind(this, column),
                    buttonModel: {
                        content: this.l10n.getConstant('FilterButton'), isPrimary: true, cssClass: 'e-flmenu-okbtn'
                    }
                },
                {
                    click: this.clearBtnClick.bind(this, column),
                    buttonModel: { content: this.l10n.getConstant('ClearButton'), cssClass: 'e-flmenu-cancelbtn' }
                }],
            content: mainDiv,
            width: (!isNullOrUndefined(parentsUntil(target, 'e-bigger'))) || this.parent.element.classList.contains('e-device') ? 260 : 250,
            animationSettings: { effect: 'None' },
            cssClass: 'e-filter-popup'
        });
        this.dlgObj.appendTo(this.dlgDiv);
    }
    dialogCreated(target, column) {
        if (!Browser.isDevice) {
            getFilterMenuPostion(target, this.dlgObj, this.parent);
        }
        this.renderFilterUI(target, column);
        this.parent.notify(filterDialogCreated, {});
        this.dlgObj.element.style.maxHeight = '350px';
        this.dlgObj.show();
        this.writeMethod(column, this.dlgObj.element.querySelector('#' + column.uid + '-flmenu'));
        let args = {
            requestType: filterAfterOpen,
            filterModel: this, columnName: column.field, columnType: column.type
        };
        this.isDialogOpen = true;
        this.parent.trigger(actionComplete, args);
    }
    renderFilterUI(target, col) {
        let dlgConetntEle = this.dlgObj.element.querySelector('.e-flmenu-maindiv');
        this.renderOperatorUI(dlgConetntEle, target, col);
        this.renderFlValueUI(dlgConetntEle, target, col);
    }
    renderOperatorUI(dlgConetntEle, target, column) {
        this.flMuiObj.renderOperatorUI(dlgConetntEle, target, column, this.dlgObj);
    }
    renderFlValueUI(dlgConetntEle, target, column) {
        let valueDiv = createElement('div', { className: 'e-flmenu-valuediv' });
        dlgConetntEle.appendChild(valueDiv);
        let args = { target: valueDiv, column: column, getOptrInstance: this.flMuiObj, dialogObj: this.dlgObj };
        let instanceofFilterUI = new this.colTypes[column.type](this.parent, this.serviceLocator, this.parent.filterSettings);
        if (!isNullOrUndefined(column.filter) && !isNullOrUndefined(column.filter.ui)
            && !isNullOrUndefined(column.filter.ui.create)) {
            let temp = column.filter.ui.create;
            if (typeof temp === 'string') {
                temp = getValue(temp, window);
            }
            column.filter.ui.create({
                column: column, target: valueDiv,
                getOptrInstance: this.flMuiObj, dialogObj: this.dlgObj
            });
        }
        else {
            instanceofFilterUI.create({
                column: column, target: valueDiv,
                getOptrInstance: this.flMuiObj, localizeText: this.l10n, dialogObj: this.dlgObj
            });
        }
    }
    writeMethod(col, dlgContentEle) {
        let flValue;
        let target = dlgContentEle.querySelector('.e-flmenu-valinput');
        let instanceofFilterUI = new this.colTypes[col.type](this.parent, this.serviceLocator, this.parent.filterSettings);
        let columns = this.filterSettings.columns;
        for (let column of columns) {
            if (col.field === column.field || col.foreignKeyValue === column.field) {
                flValue = column.value;
            }
        }
        if (!isNullOrUndefined(col.filter) && !isNullOrUndefined(col.filter.ui)
            && !isNullOrUndefined(col.filter.ui.write)) {
            let temp = col.filter.ui.write;
            if (typeof temp === 'string') {
                temp = getValue(temp, window);
            }
            col.filter.ui.write({ column: col, target: target, parent: this.parent, filteredValue: flValue });
        }
        else {
            instanceofFilterUI.write({ column: col, target: target, parent: this.parent, filteredValue: flValue });
        }
    }
    filterBtnClick(col) {
        let flValue;
        let flOptrValue;
        let targ = this.dlgObj.element.querySelector('.e-flmenu-valuediv input');
        flOptrValue = this.flMuiObj.getFlOperator();
        let instanceofFilterUI = new this.colTypes[col.type](this.parent, this.serviceLocator, this.parent.filterSettings);
        if (!isNullOrUndefined(col.filter) &&
            !isNullOrUndefined(col.filter.ui) && !isNullOrUndefined(col.filter.ui.read)) {
            let temp = col.filter.ui.read;
            if (typeof temp === 'string') {
                temp = getValue(temp, window);
            }
            flValue = col.filter.ui.read({ element: targ, column: col, operator: flOptrValue, fltrObj: this.filterObj });
        }
        else {
            instanceofFilterUI.read(targ, col, flOptrValue, this.filterObj);
        }
        let iconClass = this.parent.showColumnMenu ? '.e-columnmenu' : '.e-icon-filter';
        let column = this.parent.element.querySelector('[e-mappinguid="' + col.uid + '"]').parentElement;
        let flIcon = column.querySelector(iconClass);
        if (flIcon) {
            flIcon.classList.add('e-filtered');
        }
        this.closeDialog();
    }
    clearBtnClick(column) {
        this.filterObj.removeFilteredColsByField(column.field);
        this.closeDialog();
        let iconClass = this.parent.showColumnMenu ? '.e-columnmenu' : '.e-icon-filter';
        let col = this.parent.element.querySelector('[e-mappinguid="' + column.uid + '"]').parentElement;
        let flIcon = col.querySelector(iconClass);
        if (flIcon) {
            flIcon.classList.remove('e-filtered');
        }
    }
    destroy() {
        this.closeDialog();
    }
}

/**
 * @hidden
 * `ExcelFilter` module is used to handle filtering action.
 */
class ExcelFilter extends CheckBoxFilter {
    /**
     * Constructor for excel filtering module
     * @hidden
     */
    constructor(parent, filterSettings, serviceLocator, customFltrOperators) {
        super(parent, filterSettings, serviceLocator);
        this.localeConstants = {
            ClearFilter: 'Clear Filter',
            NumberFilter: 'Number Filters',
            TextFilter: 'Text Filters',
            DateFilter: 'Date Filters',
            MatchCase: 'Match Case',
            Equal: 'Equal',
            NotEqual: 'Not Equal',
            LessThan: 'Less Than',
            LessThanOrEqual: 'Less Than Or Equal',
            GreaterThan: 'Greater Than',
            GreaterThanOrEqual: 'Greater Than Or Equal',
            Between: 'Between',
            CustomFilter: 'Custom Filter',
            StartsWith: 'Starts With',
            EndsWith: 'Ends With',
            Contains: 'Contains',
            OK: 'OK',
            Cancel: 'Cancel',
            CustomFilterPlaceHolder: 'Enter the value',
            CustomFilterDatePlaceHolder: 'Choose a date',
            AND: 'AND',
            OR: 'OR',
            ShowRowsWhere: 'Show rows where:'
        };
        this.customFilterOperators = customFltrOperators;
        extend(this.defaultConstants, this.localeConstants);
        this.isExcel = true;
        this.initLocale(this.defaultConstants);
    }
    getCMenuDS(type, operator) {
        let options = {
            number: ['Equal', 'NotEqual', '', 'LessThan', 'LessThanOrEqual', 'GreaterThan',
                'GreaterThanOrEqual', 'Between', '', 'CustomFilter'],
            string: ['Equal', 'NotEqual', '', 'StartsWith', 'EndsWith', '', 'Contains', '', 'CustomFilter'],
        };
        options.date = options.number;
        options.datetime = options.number;
        let model = [];
        for (let i = 0; i < options[type].length; i++) {
            if (options[type][i].length) {
                if (operator) {
                    model.push({
                        text: this.getLocalizedLabel(options[type][i]) + '...',
                        iconCss: 'e-icons e-icon-check ' + (operator === options[type][i] ? '' : 'e-emptyicon')
                    });
                }
                else {
                    model.push({
                        text: this.getLocalizedLabel(options[type][i]) + '...'
                    });
                }
            }
            else {
                model.push({ separator: true });
            }
        }
        return model;
    }
    /**
     * To destroy the filter bar.
     * @return {void}
     * @hidden
     */
    destroy() {
        if (this.dlg) {
            this.unwireExEvents();
            super.destroy();
        }
        if (this.cmenu.parentElement) {
            remove(this.cmenu);
        }
    }
    createMenu(type, isFiltered, isCheckIcon) {
        let options = { string: 'TextFilter', date: 'DateFilter', datetime: 'DateFilter', number: 'NumberFilter' };
        this.menu = createElement('div', { className: 'e-contextmenu-wrapper' });
        if (this.parent.enableRtl) {
            this.menu.classList.add('e-rtl');
        }
        else {
            this.menu.classList.remove('e-rtl');
        }
        let ul = createElement('ul');
        let icon = isFiltered ? 'e-excl-filter-icon e-filtered' : 'e-excl-filter-icon';
        ul.appendChild(this.createMenuElem(this.getLocalizedLabel('ClearFilter'), isFiltered ? '' : 'e-disabled', icon));
        if (type !== 'boolean') {
            ul.appendChild(this.createMenuElem(this.getLocalizedLabel(options[type]), 'e-submenu', isCheckIcon && this.ensureTextFilter() ? 'e-icon-check' : icon + ' e-emptyicon', true));
        }
        this.menu.appendChild(ul);
    }
    createMenuElem(val, className, iconName, isSubMenu) {
        let li = createElement('li', { className: className + ' e-menu-item' });
        li.innerHTML = val;
        li.insertBefore(createElement('span', { className: 'e-menu-icon e-icons ' + iconName }), li.firstChild);
        if (isSubMenu) {
            li.appendChild(createElement('span', { className: 'e-icons e-caret' }));
        }
        return li;
    }
    wireExEvents() {
        EventHandler.add(this.dlg, 'mouseover', this.hoverHandler, this);
        EventHandler.add(this.dlg, 'click', this.clickExHandler, this);
    }
    unwireExEvents() {
        EventHandler.remove(this.dlg, 'mouseover', this.hoverHandler);
        EventHandler.remove(this.dlg, 'click', this.clickExHandler);
    }
    clickExHandler(e) {
        let menuItem = parentsUntil(e.target, 'e-menu-item');
        if (menuItem && this.getLocalizedLabel('ClearFilter') === menuItem.innerText.trim()) {
            this.clearFilter();
            this.closeDialog();
        }
    }
    destroyCMenu() {
        if (this.menuObj && !this.menuObj.isDestroyed) {
            this.menuObj.destroy();
            remove(this.cmenu);
        }
    }
    hoverHandler(e) {
        let target = e.target.querySelector('.e-contextmenu');
        let li = parentsUntil(e.target, 'e-menu-item');
        let focused = this.menu.querySelector('.e-focused');
        let isSubMenu;
        if (focused) {
            focused.classList.remove('e-focused');
        }
        if (li) {
            li.classList.add('e-focused');
            isSubMenu = li.classList.contains('e-submenu');
        }
        if (target) {
            return;
        }
        if (!isSubMenu) {
            let submenu = this.menu.querySelector('.e-submenu');
            if (!isNullOrUndefined(submenu)) {
                submenu.classList.remove('e-selected');
            }
            this.isCMenuOpen = false;
            this.destroyCMenu();
        }
        let selectedMenu = this.ensureTextFilter();
        if (!this.isCMenuOpen && isSubMenu) {
            li.classList.add('e-selected');
            this.isCMenuOpen = true;
            let menuOptions = {
                items: this.getCMenuDS(this.options.type, selectedMenu ? selectedMenu.replace(/\s/g, '') : undefined),
                select: this.selectHandler.bind(this),
                onClose: this.destroyCMenu.bind(this),
                enableRtl: this.parent.enableRtl,
                beforeClose: this.preventClose
            };
            this.parent.element.appendChild(this.cmenu);
            this.menuObj = new ContextMenu(menuOptions, this.cmenu);
            let client = this.menu.querySelector('.e-submenu').getBoundingClientRect();
            let pos = { top: 0, left: 0 };
            if (Browser.isDevice) {
                let contextRect = this.getContextBounds(this.menuObj);
                pos.top = (window.innerHeight - contextRect.height) / 2;
                pos.left = (window.innerWidth - contextRect.width) / 2;
                this.closeDialog();
            }
            else {
                pos.top = client.top;
                pos.left = this.getCMenuYPosition(this.dlg, this.menuObj);
            }
            this.menuObj.open(pos.top, pos.left);
        }
    }
    ensureTextFilter() {
        let selectedMenu;
        let predicates = this.existingPredicate[this.options.field];
        if (predicates && predicates.length === 2) {
            if (predicates[0].operator === 'greaterThanOrEqual' && predicates[1].operator === 'lessThanOrEqual') {
                selectedMenu = 'Between';
            }
            else {
                selectedMenu = 'CustomFilter';
            }
        }
        else {
            if (predicates && predicates.length === 1) {
                this.optrData = this.customFilterOperators[this.options.type + 'Operator'];
                selectedMenu = this.getSelectedText(predicates[0].operator);
            }
        }
        return selectedMenu;
    }
    preventClose(args) {
        if (args.event instanceof MouseEvent && args.event.target.classList.contains('e-submenu')) {
            args.cancel = true;
        }
    }
    getContextBounds(context) {
        let elementVisible = this.menuObj.element.style.display;
        this.menuObj.element.style.display = 'block';
        return this.menuObj.element.getBoundingClientRect();
    }
    getCMenuYPosition(target, context) {
        let contextWidth = this.getContextBounds(context).width;
        let targetPosition = target.getBoundingClientRect();
        let leftPos = targetPosition.right + contextWidth - this.parent.element.clientWidth;
        return (leftPos < 1) ? (targetPosition.right + 1) : (targetPosition.left - contextWidth - 1);
    }
    openDialog(options) {
        this.updateModel(options);
        this.getAndSetChkElem(options);
        this.showDialog(options);
        this.dialogObj.dataBind();
        let filterLength = (this.existingPredicate[options.field] && this.existingPredicate[options.field].length) ||
            this.options.filteredColumns.filter((col) => {
                return this.options.field === col.field;
            }).length;
        this.createMenu(options.type, filterLength > 0, (filterLength === 1 || filterLength === 2));
        this.dlg.insertBefore(this.menu, this.dlg.firstChild);
        this.dlg.classList.add('e-excelfilter');
        this.dlg.classList.remove('e-checkboxfilter');
        this.cmenu = createElement('ul', { className: 'e-excel-menu' });
        this.wireExEvents();
    }
    closeDialog() {
        super.closeDialog();
    }
    selectHandler(e) {
        if (e.item) {
            this.menuItem = e.item;
            this.renderDialogue(e);
        }
    }
    renderDialogue(e) {
        let target = e.element;
        let column = this.options.field;
        let mainDiv = createElement('div', { className: 'e-xlfl-maindiv', id: column + '-xlflmenu' });
        this.dlgDiv = createElement('div', { className: 'e-xlflmenu', id: column + '-xlfldlg' });
        this.parent.element.appendChild(this.dlgDiv);
        this.dlgObj = new Dialog({
            header: 'Custom Filter',
            isModal: true,
            overlayClick: this.removeDialog.bind(this),
            showCloseIcon: true,
            closeOnEscape: false,
            target: document.body,
            // target: this.parent.element,
            visible: false,
            enableRtl: this.parent.enableRtl,
            open: () => {
                let row = this.dlgObj.element.querySelector('table.e-xlfl-table>tr');
                row.cells[1].querySelector('input:not([type=hidden])').focus();
            },
            close: this.removeDialog.bind(this),
            created: this.createdDialog.bind(this, target, column),
            buttons: [{
                    click: this.filterBtnClick.bind(this, column),
                    buttonModel: {
                        content: this.getLocalizedLabel('OK'), isPrimary: true, cssClass: 'e-xlfl-okbtn'
                    }
                },
                {
                    click: this.removeDialog.bind(this),
                    buttonModel: { content: this.getLocalizedLabel('Cancel'), cssClass: 'e-xlfl-cancelbtn' }
                }],
            content: mainDiv,
            width: 430,
            animationSettings: { effect: 'None' },
        });
        this.dlgObj.appendTo(this.dlgDiv);
    }
    removeDialog() {
        this.removeObjects([this.dropOptr, this.datePicker, this.actObj, this.numericTxtObj, this.dlgObj]);
        remove(this.dlgDiv);
    }
    clearBtnClick(field) {
        this.clearFilter();
        this.removeDialog();
    }
    createdDialog(target, column) {
        this.renderCustomFilter(target, column);
        this.dlgObj.element.style.left = '0px';
        this.dlgObj.element.style.top = '0px';
        if (Browser.isDevice && window.innerWidth < 440) {
            this.dlgObj.element.style.width = '90%';
        }
        this.dlgObj.show();
    }
    renderCustomFilter(target, column) {
        let dlgConetntEle = this.dlgObj.element.querySelector('.e-xlfl-maindiv');
        /* tslint:disable-next-line:max-line-length */
        let dlgFields = createElement('div', { innerHTML: this.getLocalizedLabel('ShowRowsWhere'), className: 'e-xlfl-dlgfields' });
        dlgConetntEle.appendChild(dlgFields);
        //column name
        let fieldSet = createElement('div', { innerHTML: this.options.displayName, className: 'e-xlfl-fieldset' });
        dlgConetntEle.appendChild(fieldSet);
        this.renderFilterUI(column, dlgConetntEle);
    }
    filterBtnClick(col) {
        let fValue = this.dlgDiv.querySelector('#' + col + '-xlfl-frstvalue').ej2_instances[0];
        let fOperator = this.dlgDiv.querySelector('#' + col + '-xlfl-frstoptr').ej2_instances[0];
        let sValue = this.dlgDiv.querySelector('#' + col + '-xlfl-secndvalue').ej2_instances[0];
        let sOperator = this.dlgDiv.querySelector('#' + col + '-xlfl-secndoptr').ej2_instances[0];
        let checkBoxValue;
        if (this.options.type === 'string') {
            let checkBox = this.dlgDiv.querySelector('#' + col + '-xlflmtcase').ej2_instances[0];
            checkBoxValue = checkBox.checked;
        }
        let andRadio = this.dlgDiv.querySelector('#' + col + 'e-xlfl-frstpredicate').ej2_instances[0];
        let orRadio = this.dlgDiv.querySelector('#' + col + 'e-xlfl-secndpredicate').ej2_instances[0];
        let predicate = (andRadio.checked ? 'and' : 'or');
        if (sValue.value === null) {
            predicate = 'or';
        }
        this.filterByColumn(this.options.field, fOperator.value, fValue.value, predicate, checkBoxValue, this.parent.filterSettings.ignoreAccent, sOperator.value, sValue.value);
        this.removeDialog();
    }
    /**
     * Filters grid row by column name with given options.
     * @param {string} fieldName - Defines the field name of the filter column.
     * @param {string} firstOperator - Defines the first operator by how to filter records.
     * @param {string | number | Date | boolean} firstValue - Defines the first value which is used to filter records.
     * @param  {string} predicate - Defines the relationship between one filter query with another by using AND or OR predicate.
     * @param {boolean} matchCase - If ignore case set to true, then filter records with exact match or else
     * filter records with case insensitive(uppercase and lowercase letters treated as same).
     * @param {boolean} ignoreAccent - If ignoreAccent set to true, then ignores the diacritic characters or accents when filtering.
     * @param {string} secondOperator - Defines the second operator by how to filter records.
     * @param {string | number | Date | boolean} secondValue - Defines the first value which is used to filter records.
     */
    filterByColumn(fieldName, firstOperator, firstValue, predicate, matchCase, ignoreAccent, secondOperator, secondValue) {
        let col = this.parent.getColumnByField(fieldName);
        let field = col.isForeignColumn() ? col.foreignKeyValue : fieldName;
        let fColl = [];
        let mPredicate;
        fColl.push({
            field: field,
            predicate: predicate,
            matchCase: matchCase,
            ignoreAccent: ignoreAccent,
            operator: firstOperator,
            value: firstValue,
            type: this.options.type
        });
        mPredicate = new Predicate(field, firstOperator.toLowerCase(), firstValue, !matchCase, ignoreAccent);
        if (secondValue) {
            secondOperator = !isNullOrUndefined(secondOperator) ? secondOperator : 'equal';
            fColl.push({
                field: field,
                predicate: predicate,
                matchCase: matchCase,
                ignoreAccent: ignoreAccent,
                operator: secondOperator,
                value: secondValue,
                type: this.options.type
            });
            /* tslint:disable-next-line:max-line-length */
            mPredicate = mPredicate[predicate](field, secondOperator.toLowerCase(), secondValue, !matchCase, ignoreAccent);
        }
        let args = {
            action: 'filtering', filterCollection: fColl, field: this.options.field,
            ejpredicate: mPredicate, actualPredicate: fColl
        };
        let fPredicate = {};
        let filterCollection = [];
        if (col.isForeignColumn()) {
            this.options.column.dataSource.
                executeQuery(new Query().where(mPredicate)).then((e) => {
                this.options.column.columnData = e.result;
                this.parent.notify(generateQuery, { predicate: fPredicate, column: col });
                args.ejpredicate = fPredicate.predicate.predicates;
                fPredicate.predicate.predicates.forEach((fpred) => {
                    filterCollection.push({
                        field: fpred.field,
                        predicate: 'or',
                        matchCase: fpred.ignoreCase,
                        ignoreAccent: fpred.ignoreAccent,
                        operator: fpred.operator,
                        value: fpred.value,
                        type: this.options.type
                    });
                });
                args.filterCollection = filterCollection.length ? filterCollection :
                    fColl.filter((col) => col.field = this.options.field);
                this.options.handler(args);
            });
        }
        else {
            this.options.handler(args);
        }
    }
    /* tslint:disable-next-line:max-line-length */
    renderOperatorUI(column, table, elementID, predicates, isFirst) {
        let fieldElement = createElement('tr', { className: 'e-xlfl-fields' });
        table.appendChild(fieldElement);
        let xlfloptr = createElement('td', { className: 'e-xlfl-optr' });
        fieldElement.appendChild(xlfloptr);
        let optrDiv = createElement('div', { className: 'e-xlfl-optrdiv' });
        let optrInput = createElement('input', { id: column + elementID });
        optrDiv.appendChild(optrInput);
        xlfloptr.appendChild(optrDiv);
        let optr = this.options.type + 'Operator';
        let dropDatasource = this.customFilterOperators[optr];
        this.optrData = dropDatasource;
        let selectedValue = this.dropSelectedVal(column, predicates, isFirst);
        //Trailing three dots are sliced.
        let menuText = '';
        if (this.menuItem) {
            menuText = this.menuItem.text.slice(0, -3);
            if (menuText !== this.getLocalizedLabel('CustomFilter')) {
                selectedValue = isFirst ? menuText : undefined;
            }
            if (menuText === this.getLocalizedLabel('Between')) {
                selectedValue = this.getLocalizedLabel(isFirst ? 'GreaterThanOrEqual' : 'LessThanOrEqual');
            }
        }
        this.dropOptr = new DropDownList({
            dataSource: dropDatasource,
            fields: { text: 'text', value: 'value' },
            text: selectedValue,
            open: this.dropDownOpen.bind(this),
            enableRtl: this.parent.enableRtl
        });
        this.dropOptr.appendTo(optrInput);
        let operator = this.getSelectedValue(selectedValue);
        return { fieldElement, operator };
    }
    dropDownOpen(args) {
        args.popup.element.style.zIndex = (this.dialogObj.zIndex + 1).toString();
    }
    getSelectedValue(text) {
        let selectedField = new DataManager(this.optrData).executeLocal(new Query().where('text', 'equal', text));
        return !isNullOrUndefined(selectedField[0]) ? selectedField[0].value : '';
    }
    dropSelectedVal(col, predicates, isFirst) {
        let operator;
        if (predicates && predicates.length > 0) {
            operator = predicates.length === 2 ?
                (isFirst ? predicates[0].operator : predicates[1].operator) :
                (isFirst ? predicates[0].operator : undefined);
        }
        else {
            operator = isFirst ? 'equal' : undefined;
        }
        return this.getSelectedText(operator);
    }
    getSelectedText(operator) {
        let selectedField = new DataManager(this.optrData).executeLocal(new Query().where('value', 'equal', operator));
        return !isNullOrUndefined(selectedField[0]) ? selectedField[0].text : '';
    }
    renderFilterUI(column, dlgConetntEle) {
        let predicates = this.existingPredicate[column];
        let table = createElement('table', { className: 'e-xlfl-table' });
        dlgConetntEle.appendChild(table);
        let colGroup = createElement('colGroup');
        colGroup.innerHTML = '<col style="width: 50%"></col><col style="width: 50%"></col>';
        table.appendChild(colGroup);
        //Renders first dropdown
        /* tslint:disable-next-line:max-line-length */
        let optr = this.renderOperatorUI(column, table, '-xlfl-frstoptr', predicates, true);
        //Renders first value
        this.renderFlValueUI(column, optr, '-xlfl-frstvalue', predicates, true);
        let predicate = createElement('tr', { className: 'e-xlfl-predicate' });
        table.appendChild(predicate);
        //Renders first radion button
        this.renderRadioButton(column, predicate, predicates);
        //Renders second dropdown
        optr = this.renderOperatorUI(column, table, '-xlfl-secndoptr', predicates, false);
        //Renders second text box
        this.renderFlValueUI(column, optr, '-xlfl-secndvalue', predicates, false);
    }
    renderRadioButton(column, tr, predicates) {
        let td = createElement('td', { className: 'e-xlfl-radio', attrs: { 'colSpan': '2' } });
        tr.appendChild(td);
        let radioDiv = createElement('div', { className: 'e-xlfl-radiodiv', attrs: { 'style': 'display: inline-block' } });
        /* tslint:disable-next-line:max-line-length */
        let frstpredicate = createElement('input', { id: column + 'e-xlfl-frstpredicate', attrs: { 'type': 'radio' } });
        /* tslint:disable-next-line:max-line-length */
        let secndpredicate = createElement('input', { id: column + 'e-xlfl-secndpredicate', attrs: { 'type': 'radio' } });
        //appends into div
        radioDiv.appendChild(frstpredicate);
        radioDiv.appendChild(secndpredicate);
        td.appendChild(radioDiv);
        if (this.options.type === 'string') {
            this.renderMatchCase(column, tr, td, '-xlflmtcase', predicates);
        }
        // Initialize AND RadioButton component.
        /* tslint:disable-next-line:max-line-length */
        let andRadio = new RadioButton({ label: this.getLocalizedLabel('AND'), name: 'default', cssClass: 'e-xlfl-radio-and', checked: true, enableRtl: this.parent.enableRtl });
        // Initialize OR RadioButton component.
        /* tslint:disable-next-line:max-line-length */
        let orRadio = new RadioButton({ label: this.getLocalizedLabel('OR'), name: 'default', cssClass: 'e-xlfl-radio-or', enableRtl: this.parent.enableRtl });
        let flValue = predicates && predicates.length === 2 ? predicates[1].predicate : 'and';
        if (flValue === 'and') {
            andRadio.checked = true;
            orRadio.checked = false;
        }
        else {
            orRadio.checked = true;
            andRadio.checked = false;
        }
        // Render initialized RadioButton.
        andRadio.appendTo(frstpredicate);
        orRadio.appendTo(secndpredicate);
    }
    /* tslint:disable-next-line:no-any */
    removeObjects(elements) {
        for (let obj of elements) {
            if (obj && !obj.isDestroyed) {
                obj.destroy();
            }
        }
    }
    /* tslint:disable-next-line:max-line-length */
    renderFlValueUI(column, optr, elementId, predicates, isFirst) {
        let value = createElement('td', { className: 'e-xlfl-value' });
        optr.fieldElement.appendChild(value);
        let valueDiv = createElement('div', { className: 'e-xlfl-valuediv' });
        let valueInput = createElement('input', { id: column + elementId });
        valueDiv.appendChild(valueInput);
        value.appendChild(valueDiv);
        let flValue;
        let predicate;
        if (predicates && predicates.length > 0) {
            predicate = predicates.length === 2 ?
                (isFirst ? predicates[0] : predicates[1]) :
                (isFirst ? predicates[0] : undefined);
            flValue = (predicate && predicate.operator === optr.operator) ? predicate.value : undefined;
        }
        let types = {
            'string': this.renderAutoComplete.bind(this),
            'number': this.renderNumericTextBox.bind(this),
            'date': this.renderDate.bind(this),
            'datetime': this.renderDate.bind(this)
        };
        types[this.options.type](this.options, column, valueInput, flValue, this.parent.enableRtl);
    }
    /* tslint:disable-next-line:max-line-length */
    renderMatchCase(column, tr, matchCase, elementId, predicates) {
        /* tslint:disable-next-line:max-line-length */
        let matchCaseDiv = createElement('div', { className: 'e-xlfl-matchcasediv', attrs: { 'style': 'display: inline-block' } });
        let matchCaseInput = createElement('input', { id: column + elementId, attrs: { 'type': 'checkbox' } });
        matchCaseDiv.appendChild(matchCaseInput);
        matchCase.appendChild(matchCaseDiv);
        let flValue = predicates && predicates.length > 0 ?
            (predicates && predicates.length === 2 ? predicates[1].matchCase : predicates[0].matchCase) :
            false;
        // Initialize Match Case check box.
        let checkbox = new CheckBox({ label: 'Match Case', enableRtl: this.parent.enableRtl, checked: flValue });
        // Render initialized CheckBox.
        checkbox.appendTo(matchCaseInput);
    }
    /* tslint:disable-next-line:max-line-length */
    renderDate(options, column, inputValue, fValue, isRtl) {
        let intl = new Internationalization();
        let format = intl.getDatePattern({ type: 'date', skeleton: options.format }, false);
        this.datePicker = new DatePicker({
            format: format,
            cssClass: 'e-popup-flmenu',
            placeholder: this.getLocalizedLabel('CustomFilterDatePlaceHolder'),
            width: '100%',
            enableRtl: isRtl,
            value: new Date(fValue),
        });
        this.datePicker.appendTo(inputValue);
    }
    completeAction(e) {
        e.result = distinctStringValues(e.result);
    }
    /* tslint:disable-next-line:max-line-length */
    renderNumericTextBox(options, column, inputValue, fValue, isRtl) {
        this.numericTxtObj = new NumericTextBox({
            format: options.format,
            placeholder: this.getLocalizedLabel('CustomFilterPlaceHolder'),
            enableRtl: isRtl,
            value: fValue
        });
        this.numericTxtObj.appendTo(inputValue);
    }
    /* tslint:disable-next-line:max-line-length */
    renderAutoComplete(options, column, inputValue, fValue, isRtl) {
        let colObj = this.parent.getColumnByField(column);
        let isForeignColumn = colObj.isForeignColumn();
        let dataSource = isForeignColumn ? colObj.dataSource : options.dataSource;
        let fields = { value: isForeignColumn ? colObj.foreignKeyValue : column };
        let actObj = new AutoComplete({
            dataSource: dataSource instanceof DataManager ? dataSource : new DataManager(dataSource),
            fields: fields,
            sortOrder: 'Ascending',
            locale: this.parent.locale,
            autofill: true,
            focus: () => {
                actObj.filterType = this.dlgDiv.querySelector('#' + column +
                    (inputValue.id === (column + '-xlfl-frstvalue') ?
                        '-xlfl-frstoptr' :
                        '-xlfl-secndoptr')).ej2_instances[0].value;
                actObj.ignoreCase = options.type === 'string' ?
                    !this.dlgDiv.querySelector('#' + column + '-xlflmtcase').ej2_instances[0].checked :
                    true;
                actObj.filterType = !isNullOrUndefined(actObj.filterType) ? actObj.filterType :
                    'equal';
            },
            placeholder: this.getLocalizedLabel('CustomFilterPlaceHolder'),
            enableRtl: isRtl,
            actionComplete: (e) => {
                e.result = e.result.filter((obj, index, arr) => {
                    return arr.map((mapObject) => {
                        return mapObject[actObj.fields.value];
                    }).indexOf(obj[this.actObj.fields.value]) === index;
                });
            },
            value: fValue
        });
        actObj.appendTo(inputValue);
        this.actObj = actObj;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'excelFilter';
    }
}

/**
 *
 * The `Filter` module is used to handle filtering action.
 */
class Filter {
    /**
     * Constructor for Grid filtering module
     * @hidden
     */
    constructor(parent, filterSettings, serviceLocator) {
        this.predicate = 'and';
        this.contentRefresh = true;
        this.values = {};
        this.nextFlMenuOpen = '';
        this.type = { 'Menu': FilterMenuRenderer, 'CheckBox': CheckBoxFilter, 'Excel': ExcelFilter };
        this.filterOperators = {
            contains: 'contains', endsWith: 'endswith', equal: 'equal', greaterThan: 'greaterthan', greaterThanOrEqual: 'greaterthanorequal',
            lessThan: 'lessthan', lessThanOrEqual: 'lessthanorequal', notEqual: 'notequal', startsWith: 'startswith'
        };
        this.fltrDlgDetails = { field: '', isOpen: false };
        this.actualPredicate = {};
        this.parent = parent;
        this.filterSettings = filterSettings;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    /**
     * To render filter bar when filtering enabled.
     * @return {void}
     * @hidden
     */
    render(e) {
        if (DataUtil.getObject('args.isFrozen', e)) {
            return;
        }
        let gObj = this.parent;
        this.l10n = this.serviceLocator.getService('localization');
        this.getLocalizedCustomOperators();
        if (this.parent.filterSettings.type === 'FilterBar') {
            if (gObj.columns.length) {
                let fltrElem = this.parent.element.querySelector('.e-filterbar');
                if (fltrElem) {
                    remove(fltrElem);
                }
                let rowRenderer = new RowRenderer(this.serviceLocator, CellType.Filter, gObj);
                let row;
                let cellrender = this.serviceLocator.getService('cellRendererFactory');
                cellrender.addCellRenderer(CellType.Filter, new FilterCellRenderer(this.parent, this.serviceLocator));
                this.valueFormatter = this.serviceLocator.getService('valueFormatter');
                rowRenderer.element = createElement('tr', { className: 'e-filterbar' });
                row = this.generateRow();
                row.data = this.values;
                this.parent.getHeaderContent().querySelector('thead').appendChild(rowRenderer.element);
                this.element = rowRenderer.render(row, gObj.getColumns(), null, null, rowRenderer.element);
                let detail = this.element.querySelector('.e-detailheadercell');
                if (detail) {
                    detail.className = 'e-filterbarcell e-mastercell';
                }
                let gCells = [].slice.call(this.element.querySelectorAll('.e-grouptopleftcell'));
                if (gCells.length) {
                    gCells[gCells.length - 1].classList.add('e-lastgrouptopleftcell');
                }
                this.wireEvents();
                this.parent.notify(freezeRender, { case: 'filter' });
            }
        }
    }
    /**
     * To destroy the filter bar.
     * @return {void}
     * @hidden
     */
    destroy() {
        if (this.filterModule) {
            this.filterModule.destroy();
        }
        this.filterSettings.columns = [];
        this.updateFilterMsg();
        this.removeEventListener();
        this.unWireEvents();
        if (this.element) {
            remove(this.element);
            if (this.parent.getFrozenColumns()) {
                remove(this.parent.getHeaderContent().querySelector('.e-filterbar'));
            }
        }
    }
    generateRow(index) {
        let options = {};
        let row = new Row(options);
        row.cells = this.generateCells();
        return row;
    }
    generateCells() {
        //TODO: generate dummy column for group, detail, stacked row here for filtering;
        let cells = [];
        if (this.parent.allowGrouping) {
            for (let c = 0, len = this.parent.groupSettings.columns.length; c < len; c++) {
                cells.push(this.generateCell({}, CellType.HeaderIndent));
            }
        }
        if (this.parent.detailTemplate || this.parent.childGrid) {
            cells.push(this.generateCell({}, CellType.DetailHeader));
        }
        for (let dummy of this.parent.getColumns()) {
            cells.push(this.generateCell(dummy));
        }
        return cells;
    }
    generateCell(column, cellType) {
        let opt = {
            'visible': column.visible,
            'isDataCell': false,
            'rowId': '',
            'column': column,
            'cellType': cellType ? cellType : CellType.Filter,
            'attributes': { title: this.l10n.getConstant('FilterbarTitle') }
        };
        return new Cell(opt);
    }
    /**
     * To update filterSettings when applying filter.
     * @return {void}
     * @hidden
     */
    updateModel() {
        let col = this.parent.getColumnByField(this.fieldName);
        let field = col.isForeignColumn() ? col.foreignKeyValue : this.fieldName;
        this.currentFilterObject = {
            field: field, operator: this.operator, value: this.value, predicate: this.predicate,
            matchCase: this.matchCase, ignoreAccent: this.ignoreAccent, actualFilterValue: {}, actualOperator: {}
        };
        let index = this.getFilteredColsIndexByField(col);
        if (index > -1) {
            this.filterSettings.columns[index] = this.currentFilterObject;
        }
        else {
            this.filterSettings.columns.push(this.currentFilterObject);
        }
        this.filterSettings.columns = this.filterSettings.columns;
        this.parent.dataBind();
    }
    getFilteredColsIndexByField(col) {
        let cols = this.filterSettings.columns;
        for (let i = 0, len = cols.length; i < len; i++) {
            if (cols[i].field === col.field || (col.isForeignColumn() && cols[i].field === col.foreignKeyValue)) {
                return i;
            }
        }
        return -1;
    }
    /**
     * To trigger action complete event.
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        let args = !this.isRemove ? {
            currentFilterObject: this.currentFilterObject, currentFilteringColumn: this.column.field,
            columns: this.filterSettings.columns, requestType: 'filtering', type: actionComplete
        } : {
            requestType: 'filtering', type: actionComplete
        };
        this.parent.trigger(actionComplete, extend(e, args));
        this.isRemove = false;
    }
    wireEvents() {
        EventHandler.add(this.parent.getHeaderContent(), 'keyup', this.keyUpHandler, this);
    }
    unWireEvents() {
        EventHandler.remove(this.parent.getHeaderContent(), 'keyup', this.keyUpHandler);
    }
    enableAfterRender(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.render();
        }
    }
    initialEnd() {
        this.parent.off(contentReady, this.initialEnd);
        if (this.parent.getColumns().length && this.filterSettings.columns.length) {
            let gObj = this.parent;
            this.contentRefresh = false;
            for (let col of gObj.filterSettings.columns) {
                this.filterByColumn(col.field, col.operator, col.value, col.predicate, col.matchCase, col.ignoreAccent, col.actualFilterValue, col.actualOperator);
            }
            this.updateFilterMsg();
            this.contentRefresh = true;
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(uiUpdate, this.enableAfterRender, this);
        this.parent.on(filterComplete, this.onActionComplete, this);
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(keyPressed, this.keyUpHandler, this);
        this.parent.on(columnPositionChanged, this.columnPositionChanged, this);
        this.parent.on(headerRefreshed, this.render, this);
        this.parent.on(contentReady, this.initialEnd, this);
        this.parent.on(filterMenuClose, this.filterMenuClose, this);
        EventHandler.add(document, 'click', this.clickHandler, this);
        this.parent.on(filterOpen, this.columnMenuFilter, this);
        this.parent.on(click, this.filterIconClickHandler, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        EventHandler.remove(document, 'click', this.clickHandler);
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(uiUpdate, this.enableAfterRender);
        this.parent.off(filterComplete, this.onActionComplete);
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(keyPressed, this.keyUpHandler);
        this.parent.off(columnPositionChanged, this.columnPositionChanged);
        this.parent.off(headerRefreshed, this.render);
        this.parent.off(filterOpen, this.columnMenuFilter);
        this.parent.off(filterMenuClose, this.filterMenuClose);
        this.parent.off(click, this.filterIconClickHandler);
    }
    filterMenuClose(args) {
        this.fltrDlgDetails.isOpen = false;
    }
    /**
     * Filters the Grid row by fieldName, filterOperator, and filterValue.
     * @param  {string} fieldName - Defines the field name of the filter column.
     * @param  {string} filterOperator - Defines the operator to filter records.
     * @param  {string | number | Date | boolean} filterValue - Defines the value which is used to filter records.
     * @param  {string} predicate - Defines the relationship of one filter query with another by using AND or OR predicate.
     * @param  {boolean} matchCase - If match case is set to true, then the filter records
     * the exact match or <br> filters records that are case insensitive (uppercase and lowercase letters treated the same).
     * @param {boolean} ignoreAccent - If ignoreAccent set to true, then filter ignores the diacritic characters or accents while filtering.
     * @param  {string} actualFilterValue - Defines the actual filter value for the filter column.
     * @param  {string} actualOperator - Defines the actual filter operator for the filter column.
     * @return {void}
     */
    filterByColumn(fieldName, filterOperator, filterValue, predicate, matchCase, ignoreAccent, actualFilterValue, actualOperator) {
        let gObj = this.parent;
        let filterCell;
        this.column = gObj.getColumnByField(fieldName);
        if (this.filterSettings.type === 'FilterBar') {
            filterCell = gObj.getHeaderContent().querySelector('[id=\'' + this.column.field + '_filterBarcell\']');
        }
        if (!isNullOrUndefined(this.column.allowFiltering) && !this.column.allowFiltering) {
            return;
        }
        if (isActionPrevent(gObj)) {
            gObj.notify(preventBatch, {
                instance: this, handler: this.filterByColumn, arg1: fieldName, arg2: filterOperator, arg3: filterValue, arg4: predicate,
                arg5: matchCase, arg6: ignoreAccent, arg7: actualFilterValue, arg8: actualOperator
            });
            return;
        }
        this.value = filterValue;
        this.matchCase = matchCase || false;
        this.ignoreAccent = this.ignoreAccent = !isNullOrUndefined(ignoreAccent) ? ignoreAccent : this.parent.filterSettings.ignoreAccent;
        this.fieldName = fieldName;
        this.predicate = predicate || 'and';
        this.operator = filterOperator;
        filterValue = !isNullOrUndefined(filterValue) && filterValue.toString();
        if (this.column.type === 'number' || this.column.type === 'date') {
            this.matchCase = true;
        }
        gObj.getColumnHeaderByField(fieldName).setAttribute('aria-filtered', 'true');
        if (filterValue.length < 1 || this.checkForSkipInput(this.column, filterValue)) {
            this.filterStatusMsg = filterValue.length < 1 ? '' : this.l10n.getConstant('InvalidFilterMessage');
            this.updateFilterMsg();
            return;
        }
        if (this.filterSettings.type === 'FilterBar' && filterCell.value !== filterValue) {
            filterCell.value = filterValue;
        }
        if (this.checkAlreadyColFiltered(this.column.field)) {
            return;
        }
        if (!isNullOrUndefined(this.column.format)) {
            this.applyColumnFormat(filterValue);
        }
        else {
            this.values[this.column.field] = filterValue; //this line should be above updateModel
        }
        this.updateModel();
    }
    applyColumnFormat(filterValue) {
        let getFlvalue = (this.column.type === 'date' || this.column.type === 'datetime') ?
            new Date(filterValue) : parseFloat(filterValue);
        this.values[this.column.field] = this.setFormatForFlColumn(getFlvalue, this.column);
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        for (let prop of Object.keys(e.properties)) {
            switch (prop) {
                case 'columns':
                    if (this.contentRefresh) {
                        this.parent.notify(modelChanged, {
                            currentFilterObject: this.currentFilterObject, currentFilteringColumn: this.column ?
                                this.column.field : undefined,
                            columns: this.filterSettings.columns, requestType: 'filtering', type: actionBegin
                        });
                        this.refreshFilterSettings();
                        this.updateFilterMsg();
                    }
                    break;
                case 'showFilterBarStatus':
                    if (e.properties[prop]) {
                        this.updateFilterMsg();
                    }
                    else if (this.parent.allowPaging) {
                        this.parent.updateExternalMessage('');
                    }
                    break;
                case 'type':
                    this.parent.refreshHeader();
                    break;
            }
        }
    }
    refreshFilterSettings() {
        if (this.filterSettings.type === 'FilterBar') {
            for (let i = 0; i < this.filterSettings.columns.length; i++) {
                let filterValue = this.filterSettings.columns[i].value;
                filterValue = !isNullOrUndefined(filterValue) && filterValue.toString();
                if (!isNullOrUndefined(this.column.format)) {
                    this.applyColumnFormat(filterValue);
                }
                else {
                    let key = this.filterSettings.columns[i].field;
                    this.values[key] = this.filterSettings.columns[i].value;
                }
                let selector = '[id=\'' + this.filterSettings.columns[i].field + '_filterBarcell\']';
                let filterElement = this.element.querySelector(selector);
                if (filterElement) {
                    filterElement.value = this.filterSettings.columns[i].value;
                }
            }
        }
    }
    /**
     * Clears all the filtered rows of the Grid.
     * @return {void}
     */
    clearFiltering() {
        let cols = getActualPropFromColl(this.filterSettings.columns);
        if (isActionPrevent(this.parent)) {
            this.parent.notify(preventBatch, { instance: this, handler: this.clearFiltering });
            return;
        }
        for (let i = 0, len = cols.length; i < len; i++) {
            this.removeFilteredColsByField(cols[i].field, false);
        }
        if (this.parent.filterSettings.columns.length === 0 && this.parent.element.querySelector('.e-filtered')) {
            let fltrElement = [].slice.call(this.parent.element.querySelectorAll('.e-filtered'));
            for (let i = 0, len = fltrElement.length; i < len; i++) {
                fltrElement[0].removeAttribute('aria-filtered');
                fltrElement[0].classList.remove('e-filtered');
            }
        }
        this.isRemove = true;
        this.filterStatusMsg = '';
        this.updateFilterMsg();
    }
    checkAlreadyColFiltered(field) {
        let columns = this.filterSettings.columns;
        for (let col of columns) {
            if (col.field === field && col.value === this.value &&
                col.operator === this.operator && col.predicate === this.predicate) {
                return true;
            }
        }
        return false;
    }
    columnMenuFilter(args) {
        this.column = args.col;
        let ele = closest(args.target, '#' + args.id);
        if (args.isClose && !ele) {
            this.filterModule.closeDialog();
        }
        else if (ele) {
            this.filterDialogOpen(this.column, args.target);
        }
    }
    filterDialogOpen(col, target, left, top) {
        let gObj = this.parent;
        if (this.filterModule) {
            this.filterModule.closeDialog();
        }
        this.filterModule = new this.type[col.filter.type || this.parent.filterSettings.type](this.parent, gObj.filterSettings, this.serviceLocator, this.customOperators, this);
        let dataSource = col.filter.dataSource || gObj.getDataModule().dataManager;
        this.filterModule.openDialog({
            type: col.type, field: col.field, displayName: col.headerText,
            dataSource: dataSource, format: col.format,
            filteredColumns: gObj.filterSettings.columns, target: target,
            sortedColumns: gObj.sortSettings.columns, formatFn: col.getFormatter(),
            parserFn: col.getParser(), query: gObj.query, template: col.getFilterItemTemplate(),
            hideSearchbox: isNullOrUndefined(col.filter.hideSearchbox) ? false : col.filter.hideSearchbox,
            handler: this.filterHandler.bind(this), localizedStrings: gObj.getLocaleConstants(),
            position: { X: left, Y: top }, column: col, foreignKeyValue: col.foreignKeyValue,
            actualPredicate: this.actualPredicate
        });
    }
    /**
     * Removes filtered column by field name.
     * @param  {string} field - Defines column field name to remove filter.
     * @param  {boolean} isClearFilterBar -  Specifies whether the filter bar value needs to be cleared.
     * @return {void}
     * @hidden
     */
    removeFilteredColsByField(field, isClearFilterBar) {
        let fCell;
        let cols = this.filterSettings.columns;
        if (isActionPrevent(this.parent)) {
            let args = { instance: this, handler: this.removeFilteredColsByField, arg1: field, arg2: isClearFilterBar };
            this.parent.notify(preventBatch, args);
            return;
        }
        for (let i = 0, len = cols.length; i < len; i++) {
            let column = this.parent.getColumnByField(field) ||
                getColumnByForeignKeyValue(field, this.parent.getForeignKeyColumns());
            if (cols[i].field === field || cols[i].field === column.foreignKeyValue) {
                if (this.filterSettings.type === 'FilterBar' && !isClearFilterBar) {
                    let selector = '[id=\'' + cols[i].field + '_filterBarcell\']';
                    fCell = this.parent.getHeaderContent().querySelector(selector);
                    delete this.values[field];
                }
                cols.splice(i, 1);
                let fltrElement = this.parent.getColumnHeaderByField(column.field);
                fltrElement.removeAttribute('aria-filtered');
                if (this.filterSettings.type !== 'FilterBar') {
                    let iconClass = this.parent.showColumnMenu ? '.e-columnmenu' : '.e-icon-filter';
                    fltrElement.querySelector(iconClass).classList.remove('e-filtered');
                }
                this.isRemove = true;
                this.parent.notify(modelChanged, {
                    requestType: 'filtering', type: actionBegin
                });
                break;
            }
        }
        this.updateFilterMsg();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'filter';
    }
    keyUpHandler(e) {
        let gObj = this.parent;
        let target = e.target;
        if (target && matches(target, '.e-filterbar input')) {
            this.column = gObj.getColumnByField(target.id.split('_')[0]);
            if (!this.column) {
                return;
            }
            if ((this.filterSettings.mode === 'Immediate' || e.keyCode === 13) && e.keyCode !== 9) {
                this.value = target.value.trim();
                this.processFilter(e);
            }
        }
    }
    updateCrossIcon(element) {
        if (element.value.length) {
            element.nextElementSibling.classList.remove('e-hide');
        }
    }
    updateFilterMsg() {
        if (this.filterSettings.type === 'FilterBar') {
            let gObj = this.parent;
            let columns = this.filterSettings.columns;
            let formater = this.serviceLocator.getService('valueFormatter');
            let column;
            if (!this.filterSettings.showFilterBarStatus) {
                return;
            }
            if (columns.length > 0 && this.filterStatusMsg !== this.l10n.getConstant('InvalidFilterMessage')) {
                this.filterStatusMsg = '';
                for (let index = 0; index < columns.length; index++) {
                    column = gObj.getColumnByField(columns[index].field) ||
                        getColumnByForeignKeyValue(columns[index].field, this.parent.getForeignKeyColumns());
                    if (index) {
                        this.filterStatusMsg += ' && ';
                    }
                    if (!isNullOrUndefined(column.format)) {
                        let flValue = (column.type === 'date' || column.type === 'datetime') ?
                            new Date(this.values[column.field]) :
                            this.values[column.field];
                        let getFormatFlValue = this.setFormatForFlColumn(flValue, column);
                        this.filterStatusMsg += column.headerText + ': ' + getFormatFlValue;
                    }
                    else {
                        this.filterStatusMsg += column.headerText + ': ' + this.values[column.field];
                    }
                }
            }
            if (gObj.allowPaging) {
                gObj.updateExternalMessage(this.filterStatusMsg);
            }
            //TODO: virtual paging       
            this.filterStatusMsg = '';
        }
    }
    setFormatForFlColumn(value, column) {
        let formater = this.serviceLocator.getService('valueFormatter');
        return formater.toView(value, column.getFormatter()).toString();
    }
    checkForSkipInput(column, value) {
        let isSkip;
        let skipInput;
        if (column.type === 'number') {
            skipInput = ['=', ' ', '!'];
            if (DataUtil.operatorSymbols[value] || skipInput.indexOf(value) > -1) {
                isSkip = true;
            }
        }
        else if (column.type === 'string') {
            skipInput = ['>', '<', '=', '!'];
            for (let val of value) {
                if (skipInput.indexOf(val) > -1) {
                    isSkip = true;
                }
            }
        }
        return isSkip;
    }
    processFilter(e) {
        this.stopTimer();
        this.startTimer(e);
    }
    startTimer(e) {
        this.timer = window.setInterval(() => { this.onTimerTick(); }, e.keyCode === 13 ? 0 : this.filterSettings.immediateModeDelay);
    }
    stopTimer() {
        window.clearInterval(this.timer);
    }
    onTimerTick() {
        let selector = '[id=\'' + this.column.field + '_filterBarcell\']';
        let filterElement = this.element.querySelector(selector);
        if (!filterElement && this.parent.getFrozenColumns()) {
            filterElement = this.parent.getHeaderContent().querySelector(selector);
        }
        let filterValue = JSON.parse(JSON.stringify(filterElement.value));
        this.stopTimer();
        if (!isNullOrUndefined(this.column.filterBarTemplate)) {
            let templateRead = this.column.filterBarTemplate.read;
            if (typeof templateRead === 'string') {
                templateRead = getValue(templateRead, window);
            }
            this.value = templateRead.call(this, filterElement);
        }
        if (this.value === '') {
            this.removeFilteredColsByField(this.column.field);
            return;
        }
        this.validateFilterValue(this.value);
        this.filterByColumn(this.column.field, this.operator, this.value, this.predicate, this.matchCase, this.ignoreAccent);
        filterElement.value = filterValue;
        this.updateFilterMsg();
    }
    validateFilterValue(value) {
        let gObj = this.parent;
        let skipInput;
        let index;
        this.matchCase = true;
        switch (this.column.type) {
            case 'number':
                this.operator = this.filterOperators.equal;
                skipInput = ['>', '<', '=', '!'];
                for (let i = 0; i < value.length; i++) {
                    if (skipInput.indexOf(value[i]) > -1) {
                        index = i;
                        break;
                    }
                }
                this.getOperator(value.substring(index));
                if (index !== 0) {
                    this.value = value.substring(0, index);
                }
                if (this.value !== '' && value.length >= 1) {
                    this.value = this.valueFormatter.fromView(this.value, this.column.getParser(), this.column.type);
                }
                if (isNaN(this.value)) {
                    this.filterStatusMsg = this.l10n.getConstant('InvalidFilterMessage');
                }
                break;
            case 'date':
            case 'datetime':
                this.operator = this.filterOperators.equal;
                this.getOperator(value);
                if (this.value !== '') {
                    this.value = this.valueFormatter.fromView(this.value, this.column.getParser(), this.column.type);
                    if (isNullOrUndefined(this.value)) {
                        this.filterStatusMsg = this.l10n.getConstant('InvalidFilterMessage');
                    }
                }
                break;
            case 'string':
                this.matchCase = false;
                if (value.charAt(0) === '*') {
                    this.value = this.value.slice(1);
                    this.operator = this.filterOperators.startsWith;
                }
                else if (value.charAt(value.length - 1) === '%') {
                    this.value = this.value.slice(0, -1);
                    this.operator = this.filterOperators.startsWith;
                }
                else if (value.charAt(0) === '%') {
                    this.value = this.value.slice(1);
                    this.operator = this.filterOperators.endsWith;
                }
                else {
                    this.operator = this.filterOperators.startsWith;
                }
                break;
            case 'boolean':
                if (value.toLowerCase() === 'true' || value === '1') {
                    this.value = true;
                }
                else if (value.toLowerCase() === 'false' || value === '0') {
                    this.value = false;
                }
                else if (value.length) {
                    this.filterStatusMsg = this.l10n.getConstant('InvalidFilterMessage');
                }
                this.operator = this.filterOperators.equal;
                break;
            default:
                this.operator = this.filterOperators.equal;
        }
    }
    getOperator(value) {
        let singleOp = value.charAt(0);
        let multipleOp = value.slice(0, 2);
        let operators = extend({ '=': this.filterOperators.equal, '!': this.filterOperators.notEqual }, DataUtil.operatorSymbols);
        if (operators.hasOwnProperty(singleOp) || operators.hasOwnProperty(multipleOp)) {
            this.operator = operators[singleOp];
            this.value = value.substring(1);
            if (!this.operator) {
                this.operator = operators[multipleOp];
                this.value = value.substring(2);
            }
        }
        if (this.operator === this.filterOperators.lessThan || this.operator === this.filterOperators.greaterThan) {
            if (this.value.charAt(0) === '=') {
                this.operator = this.operator + 'orequal';
                this.value = this.value.substring(1);
            }
        }
    }
    columnPositionChanged(e) {
        if (this.parent.filterSettings.type !== 'FilterBar') {
            return;
        }
    }
    getLocalizedCustomOperators() {
        let numOptr = [
            { value: 'equal', text: this.l10n.getConstant('Equal') },
            { value: 'greaterthan', text: this.l10n.getConstant('GreaterThan') },
            { value: 'greaterthanorequal', text: this.l10n.getConstant('GreaterThanOrEqual') },
            { value: 'lessthan', text: this.l10n.getConstant('LessThan') },
            { value: 'lessthanorequal', text: this.l10n.getConstant('LessThanOrEqual') },
            { value: 'notequal', text: this.l10n.getConstant('NotEqual') }
        ];
        this.customOperators = {
            stringOperator: [
                { value: 'startswith', text: this.l10n.getConstant('StartsWith') },
                { value: 'endswith', text: this.l10n.getConstant('EndsWith') },
                { value: 'contains', text: this.l10n.getConstant('Contains') },
                { value: 'equal', text: this.l10n.getConstant('Equal') },
                { value: 'notequal', text: this.l10n.getConstant('NotEqual') }
            ],
            numberOperator: numOptr,
            dateOperator: numOptr,
            datetimeOperator: numOptr,
            booleanOperator: [
                { value: 'equal', text: this.l10n.getConstant('Equal') },
                { value: 'notequal', text: this.l10n.getConstant('NotEqual') }
            ]
        };
    }
    ;
    filterIconClickHandler(e) {
        let target = e.target;
        if (target.classList.contains('e-filtermenudiv') && (this.parent.filterSettings.type === 'Menu' ||
            this.parent.filterSettings.type === 'CheckBox' || this.parent.filterSettings.type === 'Excel')) {
            let gObj = this.parent;
            let col = gObj.getColumnByUid(parentsUntil(target, 'e-headercell').firstElementChild.getAttribute('e-mappinguid'));
            let gClient = gObj.element.getBoundingClientRect();
            let fClient = target.getBoundingClientRect();
            this.column = col;
            if (this.fltrDlgDetails.field === col.field && this.fltrDlgDetails.isOpen) {
                return;
            }
            if (this.filterModule) {
                this.filterModule.closeDialog();
            }
            this.fltrDlgDetails = { field: col.field, isOpen: true };
            this.filterDialogOpen(this.column, target, fClient.right - gClient.left, fClient.bottom - gClient.top);
        }
    }
    clickHandler(e) {
        if (this.filterSettings.mode === 'Immediate' || this.parent.filterSettings.type === 'Menu' ||
            this.parent.filterSettings.type === 'CheckBox' || this.parent.filterSettings.type === 'Excel') {
            let gObj = this.parent;
            let target = e.target;
            let datepickerEle = target.classList.contains('e-day'); // due to datepicker popup cause
            if (parentsUntil(target, 'e-filter-popup') || target.classList.contains('e-filtermenudiv')) {
                return;
            }
            else if (this.filterModule &&
                (!parentsUntil(target, 'e-popup-wrapper')
                    && (!closest(target, '.e-filter-item.e-menu-item'))
                    && (!parentsUntil(target, 'e-popup'))) && !datepickerEle) {
                this.filterModule.closeDialog(target);
            }
            if (this.filterSettings.mode === 'Immediate' && target.classList.contains('e-clear-icon')) {
                let targetText = target.previousElementSibling;
                this.removeFilteredColsByField(targetText.id.slice(0, -14)); //Length of _filterBarcell = 14
            }
        }
    }
    filterHandler(args) {
        let filterIconElement;
        this.actualPredicate[args.field] = args.actualPredicate;
        let dataManager = new DataManager(this.filterSettings.columns);
        let query = new Query().where('field', this.filterOperators.equal, args.field);
        let result = dataManager.executeLocal(query);
        for (let i = 0; i < result.length; i++) {
            let index = -1;
            for (let j = 0; j < this.filterSettings.columns.length; j++) {
                if (result[i].field === this.filterSettings.columns[j].field) {
                    index = j;
                    break;
                }
            }
            if (index !== -1) {
                this.filterSettings.columns.splice(index, 1);
            }
        }
        let iconClass = this.parent.showColumnMenu ? '.e-columnmenu' : '.e-icon-filter';
        filterIconElement = this.parent.getColumnHeaderByField(args.field).querySelector(iconClass);
        if (args.action === 'filtering') {
            this.filterSettings.columns = this.filterSettings.columns.concat(args.filterCollection);
            if (this.filterSettings.columns.length && filterIconElement) {
                filterIconElement.classList.add('e-filtered');
            }
        }
        else {
            if (filterIconElement) {
                filterIconElement.classList.remove('e-filtered');
            }
            this.parent.refresh(); //hot-fix onpropertychanged not working for object { array }           
        }
        this.parent.dataBind();
    }
}

const resizeClassList = {
    root: 'e-rhandler',
    suppress: 'e-rsuppress',
    icon: 'e-ricon',
    helper: 'e-rhelper',
    header: 'th.e-headercell',
    cursor: 'e-rcursor'
};
/**
 * `Resize` module is used to handle Resize to fit for columns.
 * @hidden
 * @private
 */
class Resize {
    /**
     * Constructor for the Grid resize module
     * @hidden
     */
    constructor(parent) {
        this.tapped = false;
        this.isDblClk = true;
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.widthService = new ColumnWidthService(parent);
        this.addEventListener();
    }
    /**
     * Resize by field names.
     * @param  {string|string[]} fName - Defines the field name.
     * @return {void}
     */
    autoFitColumns(fName) {
        let columnName = (fName === undefined || fName === null || fName.length <= 0) ?
            this.parent.getColumns().map((x) => x.field) : (typeof fName === 'string') ? [fName] : fName;
        this.findColumn(columnName);
    }
    resizeColumn(fName, index, id) {
        let gObj = this.parent;
        let tWidth = 0;
        let headerTable;
        let contentTable;
        let headerDivTag = 'e-gridheader';
        let contentDivTag = 'e-gridcontent';
        let indentWidth = 0;
        let uid = id ? id : this.parent.getUidByColumnField(fName);
        let columnIndex = this.parent.getNormalizedColumnIndex(uid);
        let headerTextClone;
        let contentTextClone;
        let frzCols = gObj.getFrozenColumns();
        if (frzCols) {
            if (index < frzCols) {
                headerTable = gObj.getHeaderTable();
                contentTable = gObj.getContentTable();
                headerTextClone = headerTable.querySelectorAll('th')[columnIndex].cloneNode(true);
                contentTextClone = contentTable.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
            }
            else {
                headerTable = gObj.getHeaderContent().querySelector('.e-movableheader').children[0];
                contentTable = gObj.getContent().querySelector('.e-movablecontent').children[0];
                headerTextClone = headerTable.querySelectorAll('th')[columnIndex - frzCols].cloneNode(true);
                contentTextClone = contentTable.querySelectorAll(`td:nth-child(${(columnIndex - frzCols) + 1})`);
            }
        }
        else {
            headerTable = gObj.getHeaderTable();
            contentTable = gObj.getContentTable();
            headerTextClone = headerTable.querySelectorAll('th')[columnIndex].cloneNode(true);
            contentTextClone = contentTable.querySelectorAll(`td:nth-child(${columnIndex + 1}):not(.e-groupcaption)`);
        }
        let indentWidthClone = headerTable.querySelector('tr').querySelectorAll('.e-grouptopleftcell');
        if (indentWidthClone.length > 0) {
            for (let i = 0; i < indentWidthClone.length; i++) {
                indentWidth += indentWidthClone[i].offsetWidth;
            }
        }
        let headerText = [headerTextClone];
        let contentText = [];
        for (let i = 0; i < contentTextClone.length; i++) {
            contentText[i] = contentTextClone[i].cloneNode(true);
        }
        let wHeader = this.createTable(headerTable, headerText, headerDivTag);
        let wContent = this.createTable(contentTable, contentText, contentDivTag);
        let columnbyindex = gObj.getColumns()[index];
        let result;
        let width = (wHeader > wContent) ? columnbyindex.width = formatUnit(wHeader) : columnbyindex.width = formatUnit(wContent);
        this.widthService.setColumnWidth(gObj.getColumns()[index]);
        result = gObj.getColumns().some((x) => x.width === null || x.width === undefined || x.width.length <= 0);
        if (result === false) {
            gObj.getColumns().forEach((element) => {
                if (element.visible) {
                    tWidth = tWidth + parseInt(element.width, 10);
                }
            });
        }
        let calcTableWidth = tWidth + indentWidth;
        if (tWidth > 0 && !gObj.getFrozenColumns()) {
            headerTable.style.width = formatUnit(calcTableWidth);
            contentTable.style.width = formatUnit(calcTableWidth);
        }
        let tableWidth = headerTable.offsetWidth;
        let contentwidth = (gObj.getContent().scrollWidth);
        if (contentwidth > tableWidth) {
            headerTable.classList.add('e-tableborder');
            contentTable.classList.add('e-tableborder');
        }
        else {
            headerTable.classList.remove('e-tableborder');
            contentTable.classList.remove('e-tableborder');
        }
    }
    /**
     * To destroy the resize
     * @return {void}
     * @hidden
     */
    destroy() {
        this.widthService = null;
        this.unwireEvents();
        this.removeEventListener();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'resize';
    }
    findColumn(fName) {
        fName.forEach((element) => {
            let fieldName = element;
            let columnIndex = this.parent.getColumnIndexByField(fieldName);
            if (this.parent.getColumns()[columnIndex].visible === true) {
                this.resizeColumn(fieldName, columnIndex);
            }
        });
    }
    /**
     * To create table for autofit
     * @hidden
     */
    createTable(table, text, tag) {
        let myTableDiv = createElement('div');
        myTableDiv.className = this.parent.element.className;
        myTableDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';
        let mySubDiv = createElement('div');
        mySubDiv.className = tag;
        let myTable = createElement('table');
        myTable.className = table.className;
        myTable.style.cssText = 'table-layout: auto;width: auto';
        let myTr = createElement('tr');
        text.forEach((element) => {
            let tr = myTr.cloneNode();
            tr.className = table.querySelector('tr').className;
            tr.appendChild(element);
            myTable.appendChild(tr);
        });
        mySubDiv.appendChild(myTable);
        myTableDiv.appendChild(mySubDiv);
        document.body.appendChild(myTableDiv);
        let offsetWidthValue = myTable.getBoundingClientRect().width;
        document.body.removeChild(myTableDiv);
        return Math.ceil(offsetWidthValue);
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(headerRefreshed, this.render, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(headerRefreshed, this.render);
    }
    /**
     * @hidden
     */
    render() {
        this.unwireEvents();
        this.wireEvents();
        this.setHandlerHeight();
    }
    wireEvents() {
        this.getResizeHandlers().forEach((ele) => {
            ele.style.height = ele.parentElement.offsetHeight + 'px';
            EventHandler.add(ele, Browser.touchStartEvent, this.resizeStart, this);
            EventHandler.add(ele, dblclick, this.callAutoFit, this);
        });
    }
    unwireEvents() {
        this.getResizeHandlers().forEach((ele) => {
            EventHandler.remove(ele, Browser.touchStartEvent, this.resizeStart);
            EventHandler.remove(ele, dblclick, this.callAutoFit);
        });
    }
    getResizeHandlers() {
        return this.parent.getFrozenColumns() ?
            [].slice.call(this.parent.getHeaderContent().querySelectorAll('.' + resizeClassList.root))
            : [].slice.call(this.parent.getHeaderTable().querySelectorAll('.' + resizeClassList.root));
    }
    setHandlerHeight() {
        [].slice.call(this.parent.getHeaderTable().querySelectorAll('.' + resizeClassList.suppress)).forEach((ele) => {
            ele.style.height = ele.parentElement.offsetHeight + 'px';
        });
    }
    callAutoFit(e) {
        let col = this.getTargetColumn(e);
        this.resizeColumn(col.field, this.parent.getNormalizedColumnIndex(col.uid), col.uid);
        let header = closest(e.target, resizeClassList.header);
        header.classList.add('e-resized');
    }
    resizeStart(e) {
        if (!this.helper) {
            if (this.getScrollBarWidth() === 0) {
                for (let col of this.refreshColumnWidth()) {
                    this.widthService.setColumnWidth(col);
                }
                this.widthService.setWidthToTable();
            }
            this.element = e.target;
            this.parentElementWidth = this.parent.element.getBoundingClientRect().width;
            this.appendHelper();
            this.column = this.getTargetColumn(e);
            this.pageX = this.getPointX(e);
            if (this.parent.enableRtl) {
                this.minMove = parseInt(this.column.width.toString(), 10)
                    - (this.column.minWidth ? parseInt(this.column.minWidth.toString(), 10) : 0);
            }
            else {
                this.minMove = (this.column.minWidth ? parseInt(this.column.minWidth.toString(), 10) : 0)
                    - parseInt(this.column.width.toString(), 10);
            }
            this.minMove += this.pageX;
        }
        if (Browser.isDevice && !this.helper.classList.contains(resizeClassList.icon)) {
            this.helper.classList.add(resizeClassList.icon);
            EventHandler.add(document, Browser.touchStartEvent, this.removeHelper, this);
            EventHandler.add(this.helper, Browser.touchStartEvent, this.resizeStart, this);
        }
        else {
            let args = {
                e: e,
                column: this.column
            };
            this.parent.trigger(resizeStart, args);
            if (args.cancel) {
                this.cancelResizeAction();
                return;
            }
            EventHandler.add(document, Browser.touchEndEvent, this.resizeEnd, this);
            EventHandler.add(this.parent.element, Browser.touchMoveEvent, this.resizing, this);
            this.updateCursor('add');
        }
    }
    cancelResizeAction(removeEvents) {
        if (removeEvents) {
            EventHandler.remove(this.parent.element, Browser.touchMoveEvent, this.resizing);
            EventHandler.remove(document, Browser.touchEndEvent, this.resizeEnd);
            this.updateCursor('remove');
        }
        if (Browser.isDevice) {
            EventHandler.remove(document, Browser.touchStartEvent, this.removeHelper);
            EventHandler.remove(this.helper, Browser.touchStartEvent, this.resizeStart);
        }
        detach(this.helper);
        this.refresh();
    }
    getWidth(width, minWidth, maxWidth) {
        if (minWidth && width < minWidth) {
            return minWidth;
        }
        else if ((maxWidth && width > maxWidth)) {
            return maxWidth;
        }
        else {
            return width;
        }
    }
    resizing(e) {
        if (this.parent.allowTextWrap) {
            if (this.parent.getFrozenColumns()) {
                this.parent.notify(freezeRender, { case: 'textwrap' });
            }
            this.element.style.height = this.element.parentElement.offsetHeight + 'px';
            this.setHelperHeight();
        }
        let pageX = this.getPointX(e);
        let mousemove = this.parent.enableRtl ? -(pageX - this.pageX) : (pageX - this.pageX);
        let colData = {
            width: parseInt(this.widthService.getWidth(this.column).toString(), 10) + mousemove,
            minWidth: this.column.minWidth ? parseInt(this.column.minWidth.toString(), 10) : null,
            maxWidth: this.column.maxWidth ? parseInt(this.column.maxWidth.toString(), 10) : null
        };
        let width = this.getWidth(colData.width, colData.minWidth, colData.maxWidth);
        if ((!this.parent.enableRtl && this.minMove >= pageX) || (this.parent.enableRtl && this.minMove <= pageX)) {
            width = this.column.minWidth ? parseInt(this.column.minWidth.toString(), 10) : 0;
            this.pageX = pageX = this.minMove;
        }
        if (width !== parseInt(this.column.width.toString(), 10)) {
            this.pageX = pageX;
            this.column.width = formatUnit(width);
            let args = {
                e: e,
                column: this.column
            };
            this.parent.trigger(onResize, args);
            if (args.cancel) {
                this.cancelResizeAction(true);
                return;
            }
            this.widthService.setColumnWidth(this.column, null, 'resize');
            this.updateHelper();
        }
        this.isDblClk = false;
    }
    resizeEnd(e) {
        if (!this.helper || this.parent.isDestroyed) {
            return;
        }
        EventHandler.remove(this.parent.element, Browser.touchMoveEvent, this.resizing);
        EventHandler.remove(document, Browser.touchEndEvent, this.resizeEnd);
        this.updateCursor('remove');
        detach(this.helper);
        let args = {
            e: e,
            column: this.column
        };
        this.parent.trigger(resizeStop, args);
        closest(this.element, '.e-headercell').classList.add('e-resized');
        this.refresh();
        this.doubleTapEvent(e);
        this.isDblClk = true;
    }
    getPointX(e) {
        if (e.touches && e.touches.length) {
            return e.touches[0].pageX;
        }
        else {
            return e.pageX;
        }
    }
    refreshColumnWidth() {
        let columns = this.parent.getColumns();
        for (let ele of [].slice.apply(this.parent.getHeaderTable().querySelectorAll('th.e-headercell'))) {
            for (let column of columns) {
                if (ele.querySelector('[e-mappinguid]') &&
                    ele.querySelector('[e-mappinguid]').getAttribute('e-mappinguid') === column.uid && column.visible) {
                    column.width = ele.getBoundingClientRect().width;
                    break;
                }
            }
        }
        return columns;
    }
    getTargetColumn(e) {
        let cell = closest(e.target, resizeClassList.header);
        let uid = cell.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
        return this.parent.getColumnByUid(uid);
    }
    updateCursor(action) {
        let headerRows = [].slice.call(this.parent.getHeaderContent().querySelectorAll('th'));
        headerRows.push(this.parent.element);
        for (let row of headerRows) {
            row.classList[action](resizeClassList.cursor);
        }
    }
    refresh() {
        this.column = null;
        this.pageX = null;
        this.element = null;
        this.helper = null;
    }
    appendHelper() {
        this.helper = createElement('div', {
            className: resizeClassList.helper
        });
        this.parent.element.appendChild(this.helper);
        this.setHelperHeight();
    }
    setHelperHeight() {
        let height = this.parent.getContent().offsetHeight - this.getScrollBarWidth();
        let rect = closest(this.element, resizeClassList.header);
        let tr = [].slice.call(this.parent.getHeaderContent().querySelectorAll('tr'));
        let frzCols = this.parent.getFrozenColumns();
        if (frzCols) {
            if (rect.parentElement.children.length !== frzCols) {
                tr.splice(0, tr.length / 2);
            }
            else {
                tr.splice(tr.length / 2, tr.length / 2);
            }
        }
        for (let i = tr.indexOf(rect.parentElement); i < tr.length; i++) {
            height += tr[i].offsetHeight;
        }
        let pos = this.calcPos(rect);
        pos.left += (this.parent.enableRtl ? 0 - 1 : rect.offsetWidth - 2);
        this.helper.style.cssText = 'height: ' + height + 'px; top: ' + pos.top + 'px; left:' + Math.floor(pos.left) + 'px;';
    }
    getScrollBarWidth(height) {
        let ele = this.parent.getFrozenColumns() ? this.parent.getContent().querySelector('.e-movablecontent')
            : this.parent.getContent().firstChild;
        return (ele.scrollHeight > ele.clientHeight && height) ||
            ele.scrollWidth > ele.clientWidth ? getScrollBarWidth() : 0;
    }
    removeHelper(e) {
        let cls = e.target.classList;
        if (!(cls.contains(resizeClassList.root) || cls.contains(resizeClassList.icon)) && this.helper) {
            EventHandler.remove(document, Browser.touchStartEvent, this.removeHelper);
            EventHandler.remove(this.helper, Browser.touchStartEvent, this.resizeStart);
            detach(this.helper);
            this.refresh();
        }
    }
    updateHelper() {
        let rect = closest(this.element, resizeClassList.header);
        let left = Math.floor(this.calcPos(rect).left + (this.parent.enableRtl ? 0 - 1 : rect.offsetWidth - 2));
        let borderWidth = 2; // to maintain the helper inside of grid element.
        if (left > this.parentElementWidth) {
            left = this.parentElementWidth - borderWidth;
        }
        if (this.parent.getFrozenColumns()) {
            let table = closest(rect, '.e-table');
            let fLeft = table.offsetLeft;
            if (left < fLeft) {
                left = fLeft;
            }
        }
        this.helper.style.left = left + 'px';
    }
    calcPos(elem) {
        let parentOffset = {
            top: 0,
            left: 0
        };
        let offset = elem.getBoundingClientRect();
        let doc = elem.ownerDocument;
        let offsetParent = elem.offsetParent || doc.documentElement;
        while (offsetParent &&
            (offsetParent === doc.body || offsetParent === doc.documentElement) &&
            offsetParent.style.position === 'static') {
            offsetParent = offsetParent.parentNode;
        }
        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
            parentOffset = offsetParent.getBoundingClientRect();
        }
        return {
            top: offset.top - parentOffset.top,
            left: offset.left - parentOffset.left
        };
    }
    doubleTapEvent(e) {
        if (this.getUserAgent() && this.isDblClk) {
            if (!this.tapped) {
                this.tapped = setTimeout(this.timeoutHandler(), 300);
            }
            else {
                clearTimeout(this.tapped);
                this.callAutoFit(e);
                this.tapped = null;
            }
        }
    }
    getUserAgent() {
        let userAgent = Browser.userAgent.toLowerCase();
        return /iphone|ipod|ipad/.test(userAgent);
    }
    timeoutHandler() {
        this.tapped = null;
    }
}

/**
 *
 * The `Reorder` module is used for reordering columns.
 */
class Reorder {
    /**
     * Constructor for the Grid reorder module
     * @hidden
     */
    constructor(parent) {
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(headerDrop, this.headerDrop, this);
        this.parent.on(uiUpdate, this.enableAfterRender, this);
        this.parent.on(reorderComplete, this.onActionComplete, this);
        this.parent.on(columnDrag, this.drag, this);
        this.parent.on(columnDragStart, this.dragStart, this);
        this.parent.on(columnDragStop, this.dragStop, this);
        this.parent.on(headerDrop, this.headerDrop, this);
        this.parent.on(headerRefreshed, this.createReorderElement, this);
    }
    chkDropPosition(srcElem, destElem) {
        return (srcElem.parentElement.isEqualNode(destElem.parentElement) || (this.parent.getFrozenColumns()
            && Array.prototype.indexOf.call(closest(srcElem, 'thead').children, srcElem.parentElement)
                === Array.prototype.indexOf.call(closest(destElem, 'thead').children, destElem.parentElement)))
            && this.targetParentContainerIndex(srcElem, destElem) > -1;
    }
    chkDropAllCols(srcElem, destElem) {
        let isFound;
        let headers = this.getHeaderCells();
        let header;
        while (!isFound && headers.length > 0) {
            header = headers.pop();
            isFound = srcElem !== header && this.targetParentContainerIndex(srcElem, destElem) > -1;
        }
        return isFound;
    }
    findColParent(col, cols, parent) {
        parent = parent;
        for (let i = 0, len = cols.length; i < len; i++) {
            if (col === cols[i]) {
                return true;
            }
            else if (cols[i].columns) {
                let cnt = parent.length;
                parent.push(cols[i]);
                if (!this.findColParent(col, cols[i].columns, parent)) {
                    parent.splice(cnt, parent.length - cnt);
                }
                else {
                    return true;
                }
            }
        }
        return false;
    }
    getColumnsModel(cols) {
        let columnModel = [];
        let subCols = [];
        for (let i = 0, len = cols.length; i < len; i++) {
            columnModel.push(cols[i]);
            if (cols[i].columns) {
                subCols = subCols.concat(cols[i].columns);
            }
        }
        if (subCols.length) {
            columnModel = columnModel.concat(this.getColumnsModel(subCols));
        }
        return columnModel;
    }
    headerDrop(e) {
        let gObj = this.parent;
        if (!closest(e.target, 'th')) {
            return;
        }
        let destElem = closest(e.target, '.e-headercell');
        if (destElem && !(!this.chkDropPosition(this.element, destElem) || !this.chkDropAllCols(this.element, destElem))) {
            if (this.parent.enableColumnVirtualization) {
                let columns = this.parent.columns;
                let sourceUid = this.element.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
                let col = this.parent.getColumns(true).filter((col) => col.uid === sourceUid);
                let colMatchIndex = null;
                let column = col[0];
                let destUid = destElem.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
                let bool = columns.some((col, index) => {
                    if (col.uid === destUid) {
                        colMatchIndex = index;
                        return col.uid === destUid;
                    }
                    return false;
                });
                if (!isNullOrUndefined(colMatchIndex)) {
                    this.moveColumns(colMatchIndex, column);
                }
            }
            else {
                let headers = this.getHeaderCells();
                let oldIdx = getElementIndex(this.element, headers);
                let columns = this.getColumnsModel(this.parent.columns);
                let column = columns[oldIdx];
                let newIndex = this.targetParentContainerIndex(this.element, destElem);
                this.moveColumns(newIndex, column);
            }
        }
    }
    isActionPrevent(gObj) {
        return isActionPrevent(gObj);
    }
    moveColumns(destIndex, column) {
        let gObj = this.parent;
        if (this.isActionPrevent(gObj)) {
            gObj.notify(preventBatch, { instance: this, handler: this.moveColumns, arg1: destIndex, arg2: column });
            return;
        }
        let parent = this.getColParent(column, this.parent.columns);
        let cols = parent ? parent.columns : this.parent.columns;
        let srcIdx = inArray(column, cols);
        if (!gObj.allowReordering || srcIdx === destIndex || srcIdx === -1 || destIndex === -1) {
            return;
        }
        cols.splice(destIndex, 0, cols.splice(srcIdx, 1)[0]);
        gObj.getColumns(true);
        gObj.notify(columnPositionChanged, { fromIndex: destIndex, toIndex: srcIdx });
        gObj.notify(modelChanged, {
            type: actionBegin, requestType: 'reorder'
        });
    }
    targetParentContainerIndex(srcElem, destElem) {
        let headers = this.getHeaderCells();
        let cols = this.parent.columns;
        let flatColumns = this.getColumnsModel(cols);
        let parent = this.getColParent(flatColumns[getElementIndex(srcElem, headers)], cols);
        cols = parent ? parent.columns : cols;
        return inArray(flatColumns[getElementIndex(destElem, headers)], cols);
    }
    getHeaderCells() {
        if (this.parent.getFrozenColumns()) {
            let fTh;
            let mTh;
            let fHeaders = [];
            let fRows = [].slice.call(this.parent.getHeaderTable().querySelectorAll('.e-columnheader'));
            let mRows = [].slice.call(this.parent.getHeaderContent()
                .querySelector('.e-movableheader').querySelectorAll('.e-columnheader'));
            for (let i = 0; i < fRows.length; i++) {
                fTh = [].slice.call(fRows[i].getElementsByClassName('e-headercell'));
                mTh = [].slice.call(mRows[i].getElementsByClassName('e-headercell'));
                fHeaders = fHeaders.concat(fTh);
                for (let j = 0; j < mTh.length; j++) {
                    if (!fTh.length || j !== 0 || fTh[fTh.length - 1].innerText !== mTh[0].innerText) {
                        fHeaders.push(mTh[j]);
                    }
                }
            }
            return fHeaders;
        }
        else {
            return [].slice.call(this.parent.element.getElementsByClassName('e-headercell'));
        }
    }
    getColParent(column, columns) {
        let parents$$1 = [];
        this.findColParent(column, columns, parents$$1);
        return parents$$1[parents$$1.length - 1];
    }
    /**
     * Changes the position of the Grid columns by field names.
     * @param  {string} fromFName - Defines the origin field name.
     * @param  {string} toFName - Defines the destination field name.
     * @return {void}
     */
    reorderColumns(fromFName, toFName) {
        let column = this.parent.getColumnByField(toFName);
        let parent = this.getColParent(column, this.parent.columns);
        let columns = parent ? parent.columns : this.parent.columns;
        let destIndex = inArray(column, columns);
        if (destIndex > -1) {
            this.moveColumns(destIndex, this.parent.getColumnByField(fromFName));
        }
    }
    enableAfterRender(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.createReorderElement();
        }
    }
    createReorderElement() {
        let header = this.parent.element.querySelector('.e-headercontent');
        this.upArrow = header.appendChild(createElement('div', { className: 'e-icons e-icon-reorderuparrow e-reorderuparrow', attrs: { style: 'display:none' } }));
        this.downArrow = header.appendChild(createElement('div', { className: 'e-icons e-icon-reorderdownarrow e-reorderdownarrow', attrs: { style: 'display:none' } }));
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        this.parent.trigger(actionComplete, extend(e, { type: actionComplete }));
    }
    /**
     * To destroy the reorder
     * @return {void}
     * @hidden
     */
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        remove(this.upArrow);
        remove(this.downArrow);
        this.parent.off(headerDrop, this.headerDrop);
        this.parent.off(uiUpdate, this.enableAfterRender);
        this.parent.off(reorderComplete, this.onActionComplete);
        this.parent.off(columnDrag, this.drag);
        this.parent.off(columnDragStart, this.dragStart);
        this.parent.off(columnDragStop, this.dragStop);
        this.parent.off(headerRefreshed, this.createReorderElement);
        //call ejdrag and drop destroy
    }
    drag(e) {
        let gObj = this.parent;
        let target = e.target;
        let closest$$1 = closest(target, '.e-headercell:not(.e-stackedHeaderCell)');
        let cloneElement = gObj.element.querySelector('.e-cloneproperties');
        let isLeft = this.x > getPosition(e.event).x + gObj.getContent().firstElementChild.scrollLeft;
        removeClass(gObj.getHeaderTable().querySelectorAll('.e-reorderindicate'), ['e-reorderindicate']);
        this.setDisplay('none');
        this.stopTimer();
        classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
        this.updateScrollPostion(e.event);
        if (closest$$1 && !closest$$1.isEqualNode(this.element)) {
            target = closest$$1;
            //consider stacked, detail header cell 
            if (!(!this.chkDropPosition(this.element, target) || !this.chkDropAllCols(this.element, target))) {
                this.updateArrowPosition(target, isLeft);
                classList(target, ['e-allowDrop', 'e-reorderindicate'], []);
            }
            else if (!(gObj.allowGrouping && parentsUntil(e.target, 'e-groupdroparea'))) {
                classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
            }
        }
        gObj.trigger(columnDrag, { target: target, draggableType: 'headercell', column: e.column });
    }
    updateScrollPostion(e) {
        let frzCols = this.parent.getFrozenColumns();
        let x = getPosition(e).x;
        let cliRect = this.parent.element.getBoundingClientRect();
        let cliRectBaseLeft = frzCols ? this.parent.element.querySelector('.e-movableheader')
            .getBoundingClientRect().left : cliRect.left;
        let cliRectBaseRight = cliRect.right;
        let scrollElem = frzCols ? this.parent.getContent().querySelector('.e-movablecontent')
            : this.parent.getContent().firstElementChild;
        if (x > cliRectBaseLeft && x < cliRectBaseLeft + 35) {
            this.timer = window.setInterval(() => { this.setScrollLeft(scrollElem, true); }, 50);
        }
        else if (x < cliRectBaseRight && x > cliRectBaseRight - 35) {
            this.timer = window.setInterval(() => { this.setScrollLeft(scrollElem, false); }, 50);
        }
    }
    setScrollLeft(scrollElem, isLeft) {
        let scrollLeft = scrollElem.scrollLeft;
        scrollElem.scrollLeft = scrollElem.scrollLeft + (isLeft ? -5 : 5);
        if (scrollLeft !== scrollElem.scrollLeft) {
            this.setDisplay('none');
        }
    }
    stopTimer() {
        window.clearInterval(this.timer);
    }
    updateArrowPosition(target, isLeft) {
        let cliRect = target.getBoundingClientRect();
        let cliRectBase = this.parent.element.getBoundingClientRect();
        if ((isLeft && cliRect.left < cliRectBase.left) || (!isLeft && cliRect.right > cliRectBase.right)) {
            return;
        }
        this.upArrow.style.top = cliRect.top + cliRect.height - cliRectBase.top + 'px';
        this.downArrow.style.top = cliRect.top - cliRectBase.top - 4 + 'px';
        this.upArrow.style.left = this.downArrow.style.left = (isLeft ? cliRect.left : cliRect.right) - cliRectBase.left - 4 + 'px';
        this.setDisplay('');
    }
    dragStart(e) {
        let gObj = this.parent;
        let target = e.target;
        this.element = target.classList.contains('e-headercell') ? target :
            parentsUntil(target, 'e-headercell');
        this.x = getPosition(e.event).x + gObj.getContent().firstElementChild.scrollLeft;
        gObj.trigger(columnDragStart, {
            target: target, draggableType: 'headercell', column: e.column
        });
    }
    dragStop(e) {
        let gObj = this.parent;
        this.setDisplay('none');
        this.stopTimer();
        if (!e.cancel) {
            gObj.trigger(columnDrop, { target: e.target, draggableType: 'headercell', column: e.column });
        }
        removeClass(gObj.getHeaderTable().querySelectorAll('.e-reorderindicate'), ['e-reorderindicate']);
    }
    setDisplay(display) {
        this.upArrow.style.display = display;
        this.downArrow.style.display = display;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'reorder';
    }
}

/**
 *
 * Reorder module is used to handle row reordering.
 * @hidden
 */
class RowDD {
    /**
     * Constructor for the Grid print module
     * @hidden
     */
    constructor(parent) {
        //Internal variables    
        this.selectedRows = [];
        this.helper = (e) => {
            let gObj = this.parent;
            if (document.getElementsByClassName('e-griddragarea').length ||
                (!e.sender.target.classList.contains('e-selectionbackground') && gObj.selectionSettings.type !== 'Single')) {
                return false;
            }
            let visualElement = createElement('div', {
                className: 'e-cloneproperties e-draganddrop e-grid e-dragclone',
                styles: 'height:"auto", z-index:2, width:' + gObj.element.offsetWidth
            });
            let table = createElement('table', { styles: 'width:' + gObj.element.offsetWidth });
            let tbody = createElement('tbody');
            if (gObj.selectionSettings.mode === 'Row' && gObj.selectionSettings.type === 'Single') {
                let index = parseInt(e.sender.target.parentElement.getAttribute('aria-rowindex'), 10);
                gObj.selectRow(index);
            }
            let selectedRows = gObj.getSelectedRows();
            for (let i = 0, len = selectedRows.length; i < len; i++) {
                let selectedRow = selectedRows[i].cloneNode(true);
                removeElement(selectedRow, '.e-indentcell');
                removeElement(selectedRow, '.e-detailrowcollapse');
                removeElement(selectedRow, '.e-detailrowexpand');
                tbody.appendChild(selectedRow);
            }
            table.appendChild(tbody);
            visualElement.appendChild(table);
            gObj.element.appendChild(visualElement);
            return visualElement;
        };
        this.dragStart = (e) => {
            let gObj = this.parent;
            if (document.getElementsByClassName('e-griddragarea').length) {
                return;
            }
            gObj.trigger(rowDragStart, {
                rows: gObj.getSelectedRows(),
                target: e.target, draggableType: 'rows', data: gObj.getSelectedRecords()
            });
            let dropElem = document.getElementById(gObj.rowDropSettings.targetID);
            if (gObj.rowDropSettings.targetID && dropElem && dropElem.ej2_instances) {
                dropElem.ej2_instances[0].getContent().classList.add('e-allowRowDrop');
            }
            this.isDragStop = false;
        };
        this.drag = (e) => {
            let gObj = this.parent;
            let cloneElement = this.parent.element.querySelector('.e-cloneproperties');
            let target = this.getElementFromPosition(cloneElement, e.event);
            classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
            gObj.trigger(rowDrag, {
                rows: gObj.getSelectedRows(),
                target: target, draggableType: 'rows', data: gObj.getSelectedRecords()
            });
            gObj.element.classList.add('e-rowdrag');
            if (!parentsUntil(target, 'e-gridcontent') ||
                parentsUntil(cloneElement.parentElement, 'e-grid').id === parentsUntil(target, 'e-grid').id) {
                classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
            }
        };
        this.dragStop = (e) => {
            let gObj = this.parent;
            if (this.parent.isDestroyed) {
                return;
            }
            let target = this.getElementFromPosition(e.helper, e.event);
            gObj.element.classList.remove('e-rowdrag');
            let dropElem = document.getElementById(gObj.rowDropSettings.targetID);
            if (gObj.rowDropSettings.targetID && dropElem && dropElem.ej2_instances) {
                dropElem.ej2_instances[0].getContent().classList.remove('e-allowRowDrop');
            }
            gObj.trigger(rowDrop, {
                target: target, draggableType: 'rows',
                rows: gObj.getSelectedRows(), data: gObj.getSelectedRecords()
            });
            if (!parentsUntil(target, 'e-gridcontent')) {
                remove(e.helper);
                return;
            }
        };
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialEnd, this.initializeDrag, this);
        this.parent.on(columnDrop, this.columnDrop, this);
        this.parent.on(rowDragAndDropComplete, this.onActionComplete, this);
        this.parent.on(uiUpdate, this.enableAfterRender, this);
    }
    initializeDrag() {
        let gObj = this.parent;
        let drag;
        drag = new Draggable(gObj.getContent(), {
            dragTarget: '.e-rowcell',
            distance: 5,
            helper: this.helper,
            dragStart: this.dragStart,
            drag: this.drag,
            dragStop: this.dragStop
        });
    }
    getElementFromPosition(element, event) {
        let target;
        let position = getPosition(event);
        element.style.display = 'none';
        target = document.elementFromPoint(position.x, position.y);
        element.style.display = '';
        return target;
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        this.parent.trigger(actionComplete, extend(e, { type: actionComplete }));
    }
    getTargetIdx(targetRow) {
        return targetRow ? parseInt(targetRow.getAttribute('aria-rowindex'), 10) : 0;
    }
    columnDrop(e) {
        let gObj = this.parent;
        if (e.droppedElement.getAttribute('action') !== 'grouping') {
            let targetRow = closest(e.target, 'tr');
            let srcControl;
            let currentIndex;
            if (e.droppedElement.parentElement.id !== gObj.element.id) {
                srcControl = e.droppedElement.parentElement.ej2_instances[0];
            }
            else {
                return;
            }
            if (srcControl.element.id !== gObj.element.id && srcControl.rowDropSettings.targetID !== gObj.element.id) {
                return;
            }
            let records = srcControl.getSelectedRecords();
            let targetIndex = currentIndex = this.getTargetIdx(targetRow);
            if (isNaN(targetIndex)) {
                targetIndex = currentIndex = 0;
            }
            if (gObj.allowPaging) {
                targetIndex = targetIndex + (gObj.pageSettings.currentPage * gObj.pageSettings.pageSize) - gObj.pageSettings.pageSize;
            }
            //Todo: drag and drop mapper & BatchChanges                   
            gObj.notify(rowsAdded, { toIndex: targetIndex, records: records });
            gObj.notify(modelChanged, {
                type: actionBegin, requestType: 'rowdraganddrop'
            });
            let selectedRows = srcControl.getSelectedRowIndexes();
            let skip = srcControl.allowPaging ?
                (srcControl.pageSettings.currentPage * srcControl.pageSettings.pageSize) - srcControl.pageSettings.pageSize : 0;
            this.selectedRows = [];
            for (let i = 0, len = records.length; i < len; i++) {
                this.selectedRows.push(skip + selectedRows[i]);
            }
            srcControl.notify(rowsRemoved, { indexes: this.selectedRows, records: records });
            srcControl.notify(modelChanged, {
                type: actionBegin, requestType: 'rowdraganddrop'
            });
        }
    }
    enableAfterRender(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.initializeDrag();
        }
    }
    /**
     * To destroy the print
     * @return {void}
     * @hidden
     */
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialEnd, this.initializeDrag);
        this.parent.off(columnDrop, this.columnDrop);
        this.parent.off(rowDragAndDropComplete, this.onActionComplete);
        this.parent.off(uiUpdate, this.enableAfterRender);
        //destory ejdrag and drop
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'rowDragAndDrop';
    }
}

/**
 *
 * The `Group` module is used to handle group action.
 */
class Group {
    /**
     * Constructor for Grid group module
     * @hidden
     */
    constructor(parent, groupSettings, sortedColumns, serviceLocator) {
        this.isAppliedGroup = false;
        this.isAppliedUnGroup = false;
        this.visualElement = createElement('div', {
            className: 'e-cloneproperties e-dragclone e-gdclone',
            styles: 'line-height:23px', attrs: { action: 'grouping' }
        });
        this.helper = (e) => {
            let gObj = this.parent;
            let target = e.sender.target;
            let element = target.classList.contains('e-groupheadercell') ? target :
                parentsUntil(target, 'e-groupheadercell');
            if (!element) {
                return false;
            }
            this.column = gObj.getColumnByField(element.firstElementChild.getAttribute('ej-mappingname'));
            this.visualElement.textContent = element.textContent;
            this.visualElement.style.width = element.offsetWidth + 2 + 'px';
            this.visualElement.style.height = element.offsetHeight + 2 + 'px';
            this.visualElement.setAttribute('e-mappinguid', this.column.uid);
            gObj.element.appendChild(this.visualElement);
            return this.visualElement;
        };
        this.dragStart = () => {
            this.parent.element.classList.add('e-ungroupdrag');
        };
        this.drag = (e) => {
            let target = e.target;
            let cloneElement = this.parent.element.querySelector('.e-cloneproperties');
            this.parent.trigger(columnDrag, { target: target, draggableType: 'headercell', column: this.column });
            classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
            if (!(parentsUntil(target, 'e-gridcontent') || parentsUntil(target, 'e-headercell'))) {
                classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
            }
        };
        this.dragStop = (e) => {
            this.parent.element.classList.remove('e-ungroupdrag');
            if (!(parentsUntil(e.target, 'e-gridcontent') || parentsUntil(e.target, 'e-gridheader'))) {
                remove(e.helper);
                return;
            }
        };
        this.drop = (e) => {
            let gObj = this.parent;
            let column = gObj.getColumnByUid(e.droppedElement.getAttribute('e-mappinguid'));
            this.element.classList.remove('e-hover');
            remove(e.droppedElement);
            this.aria.setDropTarget(this.parent.element.querySelector('.e-groupdroparea'), false);
            this.aria.setGrabbed(this.parent.getHeaderTable().querySelector('[aria-grabbed=true]'), false);
            if (isNullOrUndefined(column) || column.allowGrouping === false ||
                parentsUntil(gObj.getColumnHeaderByUid(column.uid), 'e-grid').getAttribute('id') !==
                    gObj.element.getAttribute('id')) {
                return;
            }
            this.groupColumn(column.field);
        };
        this.contentRefresh = true;
        this.aria = new AriaService();
        this.parent = parent;
        this.groupSettings = groupSettings;
        this.serviceLocator = serviceLocator;
        this.sortedColumns = sortedColumns;
        this.focus = serviceLocator.getService('focus');
        this.addEventListener();
    }
    columnDrag(e) {
        let gObj = this.parent;
        let cloneElement = this.parent.element.querySelector('.e-cloneproperties');
        classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
        if (!parentsUntil(e.target, 'e-groupdroparea') &&
            !(this.parent.allowReordering && parentsUntil(e.target, 'e-headercell'))) {
            classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
        }
        e.target.classList.contains('e-groupdroparea') ? this.element.classList.add('e-hover') : this.element.classList.remove('e-hover');
    }
    columnDragStart(e) {
        if (e.target.classList.contains('e-stackedheadercell')) {
            return;
        }
        let gObj = this.parent;
        let dropArea = this.parent.element.querySelector('.e-groupdroparea');
        this.aria.setDropTarget(dropArea, e.column.allowGrouping);
        let element = e.target.classList.contains('e-headercell') ? e.target : parentsUntil(e.target, 'e-headercell');
        this.aria.setGrabbed(element, true, !e.column.allowGrouping);
    }
    columnDrop(e) {
        let gObj = this.parent;
        if (e.droppedElement.getAttribute('action') === 'grouping') {
            let column = gObj.getColumnByUid(e.droppedElement.getAttribute('e-mappinguid'));
            if (isNullOrUndefined(column) || column.allowGrouping === false ||
                parentsUntil(gObj.getColumnHeaderByUid(column.uid), 'e-grid').getAttribute('id') !==
                    gObj.element.getAttribute('id')) {
                return;
            }
            this.ungroupColumn(column.field);
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(uiUpdate, this.enableAfterRender, this);
        this.parent.on(groupComplete, this.onActionComplete, this);
        this.parent.on(ungroupComplete, this.onActionComplete, this);
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(columnDrag, this.columnDrag, this);
        this.parent.on(columnDragStart, this.columnDragStart, this);
        this.parent.on(columnDrop, this.columnDrop, this);
        this.parent.on(headerRefreshed, this.refreshSortIcons, this);
        this.parent.on(sortComplete, this.refreshSortIcons, this);
        this.parent.on(keyPressed, this.keyPressHandler, this);
        this.parent.on(contentReady, this.initialEnd, this);
        this.parent.on(onEmpty, this.initialEnd, this);
        this.parent.on(initialEnd, this.render, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialEnd, this.render);
        this.parent.off(uiUpdate, this.enableAfterRender);
        this.parent.off(groupComplete, this.onActionComplete);
        this.parent.off(ungroupComplete, this.onActionComplete);
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(click, this.clickHandler);
        this.parent.off(columnDrag, this.columnDrag);
        this.parent.off(columnDragStart, this.columnDragStart);
        this.parent.off(columnDrop, this.columnDrop);
        this.parent.off(headerRefreshed, this.refreshSortIcons);
        this.parent.off(sortComplete, this.refreshSortIcons);
        this.parent.off(keyPressed, this.keyPressHandler);
    }
    initialEnd() {
        let gObj = this.parent;
        this.parent.off(contentReady, this.initialEnd);
        this.parent.off(onEmpty, this.initialEnd);
        if (this.parent.getColumns().length && this.groupSettings.columns.length) {
            this.contentRefresh = false;
            for (let col of gObj.groupSettings.columns) {
                this.groupColumn(col);
            }
            this.contentRefresh = true;
        }
    }
    keyPressHandler(e) {
        let gObj = this.parent;
        if ((!this.groupSettings.columns.length ||
            ['altDownArrow', 'altUpArrow', 'ctrlDownArrow', 'ctrlUpArrow', 'enter'].indexOf(e.action) === -1)) {
            return;
        }
        e.preventDefault();
        switch (e.action) {
            case 'altDownArrow':
            case 'altUpArrow':
                let selected = gObj.allowSelection ? gObj.getSelectedRowIndexes() : [];
                if (selected.length) {
                    let rows = gObj.getContentTable().querySelector('tbody').children;
                    let dataRow = gObj.getDataRows()[selected[selected.length - 1]];
                    let grpRow;
                    for (let i = dataRow.rowIndex; i >= 0; i--) {
                        if (!rows[i].classList.contains('e-row') && !rows[i].classList.contains('e-detailrow')) {
                            grpRow = rows[i];
                            break;
                        }
                    }
                    this.expandCollapseRows(grpRow.querySelector(e.action === 'altUpArrow' ?
                        '.e-recordplusexpand' : '.e-recordpluscollapse'));
                }
                break;
            case 'ctrlDownArrow':
                this.expandAll();
                break;
            case 'ctrlUpArrow':
                this.collapseAll();
                break;
            case 'enter':
                if (this.parent.isEdit || (closest(e.target, '#' + this.parent.element.id + '_searchbar') !== null)) {
                    return;
                }
                let element = this.focus.getFocusedElement();
                let row = element ? element.parentElement.querySelector('[class^="e-record"]') : null;
                if (!row) {
                    break;
                }
                this.expandCollapseRows(row);
                break;
        }
    }
    clickHandler(e) {
        this.expandCollapseRows(e.target);
        this.applySortFromTarget(e.target);
        this.unGroupFromTarget(e.target);
        this.toogleGroupFromHeader(e.target);
    }
    unGroupFromTarget(target) {
        if (target.classList.contains('e-ungroupbutton')) {
            this.ungroupColumn(target.parentElement.getAttribute('ej-mappingname'));
        }
    }
    toogleGroupFromHeader(target) {
        if (this.groupSettings.showToggleButton) {
            if (target.classList.contains('e-grptogglebtn')) {
                if (target.classList.contains('e-toggleungroup')) {
                    this.ungroupColumn(this.parent.getColumnByUid(target.parentElement.getAttribute('e-mappinguid')).field);
                }
                else {
                    this.groupColumn(this.parent.getColumnByUid(target.parentElement.getAttribute('e-mappinguid')).field);
                }
            }
            else {
                if (target.classList.contains('e-toggleungroup')) {
                    this.ungroupColumn(target.parentElement.getAttribute('ej-mappingname'));
                }
            }
        }
    }
    applySortFromTarget(target) {
        let gObj = this.parent;
        let gHeader = closest(target, '.e-groupheadercell');
        if (gObj.allowSorting && gHeader && !target.classList.contains('e-ungroupbutton') &&
            !target.classList.contains('e-toggleungroup')) {
            let field = gHeader.firstElementChild.getAttribute('ej-mappingname');
            if (gObj.getColumnHeaderByField(field).querySelectorAll('.e-ascending').length) {
                gObj.sortColumn(field, 'Descending', true);
            }
            else {
                gObj.sortColumn(field, 'Ascending', true);
            }
        }
    }
    /**
     * Expands or collapses grouped rows by target element.
     * @param  {Element} target - Defines the target element of the grouped row.
     * @return {void}
     */
    expandCollapseRows(target) {
        let trgt = parentsUntil(target, 'e-recordplusexpand') ||
            parentsUntil(target, 'e-recordpluscollapse');
        if (trgt) {
            let cellIdx = trgt.cellIndex;
            let rowIdx = trgt.parentElement.rowIndex;
            let rowNodes = this.parent.getContentTable().querySelector('tbody').children;
            let rows = [].slice.call(rowNodes).slice(rowIdx + 1, rowNodes.length);
            let isHide;
            let expandElem;
            let toExpand = [];
            let indent = trgt.parentElement.querySelectorAll('.e-indentcell').length;
            let expand = false;
            if (trgt.classList.contains('e-recordpluscollapse')) {
                addClass([trgt], 'e-recordplusexpand');
                removeClass([trgt], 'e-recordpluscollapse');
                trgt.firstElementChild.className = 'e-icons e-gdiagonaldown e-icon-gdownarrow';
                expand = true;
            }
            else {
                isHide = true;
                removeClass([trgt], 'e-recordplusexpand');
                addClass([trgt], 'e-recordpluscollapse');
                trgt.firstElementChild.className = 'e-icons e-gnextforward e-icon-grightarrow';
            }
            this.aria.setExpand(trgt, expand);
            for (let i = 0, len = rows.length; i < len; i++) {
                if (rows[i].querySelectorAll('td')[cellIdx] &&
                    rows[i].querySelectorAll('td')[cellIdx].classList.contains('e-indentcell') && rows) {
                    if (isHide) {
                        rows[i].style.display = 'none';
                    }
                    else {
                        if (rows[i].querySelectorAll('.e-indentcell').length === indent + 1) {
                            rows[i].style.display = '';
                            expandElem = rows[i].querySelector('.e-recordplusexpand');
                            if (expandElem) {
                                toExpand.push(expandElem);
                            }
                            if (rows[i].classList.contains('e-detailrow')) {
                                if (rows[i - 1].querySelectorAll('.e-detailrowcollapse').length) {
                                    rows[i].style.display = 'none';
                                }
                            }
                        }
                    }
                }
                else {
                    break;
                }
            }
            for (let i = 0, len = toExpand.length; i < len; i++) {
                removeClass([toExpand[i]], 'e-recordplusexpand');
                addClass([toExpand[i]], 'e-recordpluscollapse');
                toExpand[i].firstElementChild.className = 'e-icons e-gnextforward e-icon-grightarrow';
                this.expandCollapseRows(toExpand[i]);
            }
        }
    }
    expandCollapse(isExpand) {
        let rowNodes = this.parent.getContentTable().querySelector('tbody').children;
        let row;
        for (let i = 0, len = rowNodes.length; i < len; i++) {
            if (rowNodes[i].querySelectorAll('.e-recordplusexpand, .e-recordpluscollapse').length) {
                row = rowNodes[i].querySelector(isExpand ? '.e-recordpluscollapse' : '.e-recordplusexpand');
                if (row) {
                    row.className = isExpand ? 'e-recordplusexpand' : 'e-recordpluscollapse';
                    row.firstElementChild.className = isExpand ? 'e-icons e-gdiagonaldown e-icon-gdownarrow' :
                        'e-icons e-gnextforward e-icon-grightarrow';
                }
                if (!(rowNodes[i].firstElementChild.classList.contains('e-recordplusexpand') ||
                    rowNodes[i].firstElementChild.classList.contains('e-recordpluscollapse'))) {
                    rowNodes[i].style.display = isExpand ? '' : 'none';
                }
            }
            else {
                rowNodes[i].style.display = isExpand ? '' : 'none';
            }
        }
    }
    /**
     * Expands all the grouped rows of the Grid.
     * @return {void}
     */
    expandAll() {
        this.expandCollapse(true);
    }
    /**
     * Collapses all the grouped rows of the Grid.
     * @return {void}
     */
    collapseAll() {
        this.expandCollapse(false);
    }
    /**
     * The function is used to render grouping
     * @return {Element}
     * @hidden
     */
    render() {
        this.l10n = this.serviceLocator.getService('localization');
        this.renderGroupDropArea();
        this.initDragAndDrop();
        this.refreshToggleBtn();
    }
    renderGroupDropArea() {
        let groupElem = this.parent.element.querySelector('.e-groupdroparea');
        if (groupElem) {
            remove(groupElem);
        }
        this.element = createElement('div', { className: 'e-groupdroparea', attrs: { 'tabindex': '-1' } });
        this.updateGroupDropArea();
        this.parent.element.insertBefore(this.element, this.parent.element.firstChild);
        if (!this.groupSettings.showDropArea) {
            this.element.style.display = 'none';
        }
    }
    updateGroupDropArea(clear) {
        if (this.groupSettings.showDropArea && !this.groupSettings.columns.length) {
            let dragLabel = this.l10n.getConstant('GroupDropArea');
            this.element.innerHTML = dragLabel;
            this.element.classList.remove('e-grouped');
        }
        else {
            if ((this.element.innerHTML === this.l10n.getConstant('GroupDropArea') && (this.groupSettings.columns.length === 1
                || !this.isAppliedGroup && !this.isAppliedUnGroup)) || clear) {
                this.element.innerHTML = '';
            }
            this.element.classList.add('e-grouped');
        }
    }
    initDragAndDrop() {
        this.initializeGHeaderDrop();
        this.initializeGHeaderDrag();
    }
    initializeGHeaderDrag() {
        let drag = new Draggable(this.element, {
            dragTarget: '.e-groupheadercell',
            distance: 5,
            helper: this.helper,
            dragStart: this.dragStart,
            drag: this.drag,
            dragStop: this.dragStop
        });
    }
    initializeGHeaderDrop() {
        let gObj = this.parent;
        let drop = new Droppable(this.element, {
            accept: '.e-dragclone',
            drop: this.drop
        });
    }
    /**
     * Groups a column by column name.
     * @param  {string} columnName - Defines the column name to group.
     * @return {void}
     */
    groupColumn(columnName) {
        let gObj = this.parent;
        let column = gObj.getColumnByField(columnName);
        if (isNullOrUndefined(column) || column.allowGrouping === false ||
            (this.contentRefresh && this.groupSettings.columns.indexOf(columnName) > -1)) {
            return;
        }
        if (isActionPrevent(gObj)) {
            gObj.notify(preventBatch, { instance: this, handler: this.groupColumn, arg1: columnName });
            return;
        }
        column.visible = gObj.groupSettings.showGroupedColumn;
        this.colName = columnName;
        this.isAppliedGroup = true;
        if (this.contentRefresh) {
            this.updateModel();
        }
        else {
            this.addColToGroupDrop(columnName);
        }
        this.updateGroupDropArea();
        this.isAppliedGroup = false;
    }
    /**
     * Ungroups a column by column name.
     * @param  {string} columnName - Defines the column name to ungroup.
     * @return {void}
     */
    ungroupColumn(columnName) {
        let gObj = this.parent;
        let column = this.parent.enableColumnVirtualization ?
            this.parent.columns.filter((c) => c.field === columnName)[0] : gObj.getColumnByField(columnName);
        if (isNullOrUndefined(column) || column.allowGrouping === false || this.groupSettings.columns.indexOf(columnName) < 0) {
            return;
        }
        if (isActionPrevent(gObj)) {
            gObj.notify(preventBatch, { instance: this, handler: this.ungroupColumn, arg1: columnName });
            return;
        }
        column.visible = true;
        this.colName = column.field;
        let columns = JSON.parse(JSON.stringify(this.groupSettings.columns));
        columns.splice(columns.indexOf(this.colName), 1);
        if (this.sortedColumns.indexOf(columnName) < 0) {
            for (let i = 0, len = gObj.sortSettings.columns.length; i < len; i++) {
                if (columnName === gObj.sortSettings.columns[i].field) {
                    gObj.sortSettings.columns.splice(i, 1);
                    break;
                }
            }
        }
        this.groupSettings.columns = columns;
        if (gObj.allowGrouping) {
            this.isAppliedUnGroup = true;
            this.parent.dataBind();
        }
    }
    /**
     * The function used to update groupSettings
     * @return {void}
     * @hidden
     */
    updateModel() {
        let gObj = this.parent;
        let columns = JSON.parse(JSON.stringify(this.groupSettings.columns));
        columns.push(this.colName);
        this.groupSettings.columns = columns;
        this.groupAddSortingQuery(this.colName);
        this.parent.dataBind();
    }
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    onActionComplete(e) {
        let gObj = this.parent;
        if (e.requestType === 'grouping') {
            this.addColToGroupDrop(this.colName);
        }
        else {
            this.removeColFromGroupDrop(this.colName);
        }
        let args = this.groupSettings.columns.indexOf(this.colName) > -1 ? {
            columnName: this.colName, requestType: 'grouping', type: actionComplete
        } : { requestType: 'ungrouping', type: actionComplete };
        this.parent.trigger(actionComplete, extend(e, args));
        this.colName = null;
    }
    groupAddSortingQuery(colName) {
        let i = 0;
        while (i < this.parent.sortSettings.columns.length) {
            if (this.parent.sortSettings.columns[i].field === colName) {
                break;
            }
            i++;
        }
        if (this.parent.sortSettings.columns.length === i) {
            this.parent.sortSettings.columns.push({ field: colName, direction: 'Ascending' });
        }
        else if (!this.parent.allowSorting) {
            this.parent.sortSettings.columns[i].direction = 'Ascending';
        }
    }
    addColToGroupDrop(field) {
        let gObj = this.parent;
        let direction = 'Ascending';
        let groupedColumn = createElement('div', { className: 'e-grid-icon e-groupheadercell' });
        let childDiv = createElement('div', { attrs: { 'ej-mappingname': field } });
        let column = this.parent.getColumnByField(field);
        if (isNullOrUndefined(column)) {
            return;
        }
        //Todo headerTemplateID for grouped column, disableHtmlEncode                          
        let headerCell = gObj.getColumnHeaderByUid(column.uid);
        if (!isNullOrUndefined(column.headerTemplate)) {
            if (column.headerTemplate.indexOf('#') !== -1) {
                childDiv.innerHTML = document.querySelector(column.headerTemplate).innerHTML.trim();
            }
            else {
                childDiv.innerHTML = column.headerTemplate;
            }
            childDiv.firstElementChild.classList.add('e-grouptext');
        }
        else {
            childDiv.appendChild(createElement('span', {
                className: 'e-grouptext', innerHTML: column.headerText,
                attrs: { tabindex: '-1', 'aria-label': 'sort the grouped column' }
            }));
        }
        if (this.groupSettings.showToggleButton) {
            childDiv.appendChild(createElement('span', {
                className: 'e-togglegroupbutton e-icons e-icon-ungroup e-toggleungroup', innerHTML: '&nbsp;',
                attrs: { tabindex: '-1', 'aria-label': 'ungroup button' }
            }));
        }
        if (headerCell.querySelectorAll('.e-ascending,.e-descending').length) {
            direction = headerCell.querySelector('.e-ascending') ? 'Ascending' : 'Descending';
        }
        childDiv.appendChild(createElement('span', {
            className: 'e-groupsort e-icons ' +
                ('e-' + direction.toLowerCase() + ' e-icon-' + direction.toLowerCase()), innerHTML: '&nbsp;',
            attrs: { tabindex: '-1', 'aria-label': 'sort the grouped column' }
        }));
        childDiv.appendChild(createElement('span', {
            className: 'e-ungroupbutton e-icons e-icon-hide', innerHTML: '&nbsp;',
            attrs: { title: this.l10n.getConstant('UnGroup'), tabindex: '-1', 'aria-label': 'ungroup the grouped column' },
            styles: this.groupSettings.showUngroupButton ? '' : 'display:none'
        }));
        groupedColumn.appendChild(childDiv);
        this.element.appendChild(groupedColumn);
        //Todo:  rtl 
    }
    refreshToggleBtn(isRemove) {
        if (this.groupSettings.showToggleButton) {
            let headers = [].slice.call(this.parent.element.getElementsByClassName('e-headercelldiv'));
            for (let i = 0, len = headers.length; i < len; i++) {
                if (!((headers[i].classList.contains('e-emptycell')) || (headers[i].classList.contains('e-headerchkcelldiv')))) {
                    let column = this.parent.getColumnByUid(headers[i].getAttribute('e-mappinguid'));
                    if (!this.parent.showColumnMenu || (this.parent.showColumnMenu && !column.showColumnMenu)) {
                        if (headers[i].querySelectorAll('.e-grptogglebtn').length) {
                            remove(headers[i].querySelectorAll('.e-grptogglebtn')[0]);
                        }
                        if (!isRemove) {
                            headers[i].appendChild(createElement('span', {
                                className: 'e-grptogglebtn e-icons ' +
                                    (this.groupSettings.columns.indexOf(column.field) > -1 ? 'e-toggleungroup e-icon-ungroup'
                                        : 'e-togglegroup e-icon-group'), attrs: { tabindex: '-1', 'aria-label': 'Group button' }
                            }));
                        }
                    }
                }
            }
        }
    }
    removeColFromGroupDrop(field) {
        if (!isNullOrUndefined(this.getGHeaderCell(field))) {
            remove(this.getGHeaderCell(field));
            this.updateGroupDropArea();
        }
        this.isAppliedUnGroup = false;
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        for (let prop of Object.keys(e.properties)) {
            switch (prop) {
                case 'columns':
                    let args;
                    if (this.contentRefresh) {
                        if (!this.isAppliedUnGroup) {
                            if (!this.isAppliedGroup) {
                                this.updateGroupDropArea(true);
                                for (let i = 0; i < this.groupSettings.columns.length; i++) {
                                    this.colName = this.groupSettings.columns[i];
                                    let col = this.parent.getColumnByField(this.colName);
                                    col.visible = this.parent.groupSettings.showGroupedColumn;
                                    this.groupAddSortingQuery(this.colName);
                                    if (i < this.groupSettings.columns.length - 1) {
                                        this.addColToGroupDrop(this.groupSettings.columns[i]);
                                    }
                                }
                            }
                            args = { columnName: this.colName, requestType: e.properties[prop].length ? 'grouping' : 'ungrouping',
                                type: actionBegin };
                        }
                        else {
                            args = { requestType: 'ungrouping', type: actionBegin };
                        }
                        if (!this.groupSettings.showGroupedColumn) {
                            e.oldProperties[prop].forEach((column) => {
                                if (e.properties[prop].indexOf(column) === -1) {
                                    this.parent.getColumnByField(column).visible = true;
                                }
                            });
                        }
                        this.parent.notify(modelChanged, args);
                    }
                    break;
                case 'showDropArea':
                    this.updateGroupDropArea();
                    this.groupSettings.showDropArea ? this.element.style.display = '' : this.element.style.display = 'none';
                    break;
                case 'showGroupedColumn':
                    this.updateGroupedColumn(this.groupSettings.showGroupedColumn);
                    this.parent.notify(modelChanged, { requestType: 'refresh' });
                    break;
                case 'showUngroupButton':
                    this.updateButtonVisibility(this.groupSettings.showUngroupButton, 'e-ungroupbutton');
                    break;
                case 'showToggleButton':
                    this.updateButtonVisibility(this.groupSettings.showToggleButton, 'e-togglegroupbutton ');
                    this.parent.refreshHeader();
                    break;
            }
        }
    }
    updateGroupedColumn(isVisible) {
        for (let i = 0; i < this.groupSettings.columns.length; i++) {
            this.parent.getColumnByField(this.groupSettings.columns[i]).visible = isVisible;
        }
    }
    updateButtonVisibility(isVisible, className) {
        let gHeader = [].slice.call(this.element.querySelectorAll('.' + className));
        for (let i = 0; i < gHeader.length; i++) {
            gHeader[i].style.display = isVisible ? '' : 'none';
        }
    }
    enableAfterRender(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.render();
        }
    }
    /**
     * To destroy the reorder
     * @return {void}
     * @hidden
     */
    destroy() {
        this.clearGrouping();
        this.removeEventListener();
        this.refreshToggleBtn(true);
        remove(this.element);
        //call ejdrag and drop destroy
    }
    /**
     * Clears all the grouped columns of the Grid.
     * @return {void}
     */
    clearGrouping() {
        let cols = JSON.parse(JSON.stringify(this.groupSettings.columns));
        this.contentRefresh = false;
        for (let i = 0, len = cols.length; i < len; i++) {
            this.ungroupColumn(cols[i]);
        }
        this.contentRefresh = true;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'group';
    }
    refreshSortIcons(e) {
        let gObj = this.parent;
        let header;
        let cols = gObj.sortSettings.columns;
        let gCols = gObj.groupSettings.columns;
        let fieldNames = this.parent.getColumns().map((c) => c.field);
        this.refreshToggleBtn();
        for (let i = 0, len = cols.length; i < len; i++) {
            if (fieldNames.indexOf(cols[i].field) === -1) {
                continue;
            }
            header = gObj.getColumnHeaderByField(cols[i].field);
            if (!gObj.allowSorting && (this.sortedColumns.indexOf(cols[i].field) > -1 ||
                this.groupSettings.columns.indexOf(cols[i].field) > -1)) {
                classList(header.querySelector('.e-sortfilterdiv'), ['e-ascending', 'e-icon-ascending'], []);
                if (cols.length > 1) {
                    header.querySelector('.e-headercelldiv').appendChild(createElement('span', { className: 'e-sortnumber', innerHTML: (i + 1).toString() }));
                }
            }
            else if (this.getGHeaderCell(cols[i].field) && this.getGHeaderCell(cols[i].field).querySelectorAll('.e-groupsort').length) {
                if (cols[i].direction === 'Ascending') {
                    classList(this.getGHeaderCell(cols[i].field).querySelector('.e-groupsort'), ['e-ascending', 'e-icon-ascending'], ['e-descending', 'e-icon-descending']);
                }
                else {
                    classList(this.getGHeaderCell(cols[i].field).querySelector('.e-groupsort'), ['e-descending', 'e-icon-descending'], ['e-ascending', 'e-icon-ascending']);
                }
            }
        }
        for (let i = 0, len = gCols.length; i < len; i++) {
            if (fieldNames.indexOf(gCols[i]) === -1) {
                continue;
            }
            gObj.getColumnHeaderByField(gCols[i]).setAttribute('aria-grouped', 'true');
        }
    }
    getGHeaderCell(field) {
        if (this.element && this.element.querySelector('[ej-mappingname="' + field + '"]')) {
            return this.element.querySelector('[ej-mappingname="' + field + '"]').parentElement;
        }
        return null;
    }
}

/**
 * The `DetailRow` module is used to handle detail template and hierarchy Grid operations.
 */
class DetailRow {
    /**
     * Constructor for the Grid detail template module
     * @hidden
     */
    constructor(parent, locator) {
        //Internal variables
        this.aria = new AriaService();
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.focus = locator.getService('focus');
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(destroy, this.destroy, this);
        this.parent.on(keyPressed, this.keyPressHandler, this);
    }
    clickHandler(e) {
        this.toogleExpandcollapse(closest(e.target, 'td'));
    }
    toogleExpandcollapse(target) {
        let gObj = this.parent;
        let parent = 'parentDetails';
        if (target && (target.classList.contains('e-detailrowcollapse') || target.classList.contains('e-detailrowexpand'))) {
            let tr = target.parentElement;
            let uid = tr.getAttribute('data-uid');
            let nextRow = this.parent.getContentTable().querySelector('tbody').children[tr.rowIndex + 1];
            if (target.classList.contains('e-detailrowcollapse')) {
                let key = 'records';
                let currentViewData = gObj.allowGrouping && gObj.groupSettings.columns.length ?
                    gObj.currentViewData[key] : gObj.currentViewData;
                let data = currentViewData[tr.getAttribute('aria-rowindex')];
                if (this.isDetailRow(nextRow)) {
                    nextRow.style.display = '';
                }
                else if (gObj.getDetailTemplate() || gObj.childGrid) {
                    let detailRow = createElement('tr', { className: 'e-detailrow' });
                    let detailCell = createElement('td', { className: 'e-detailcell' });
                    detailCell.setAttribute('colspan', this.parent.getVisibleColumns().length.toString());
                    let row = new Row({
                        isDataRow: true,
                        isExpand: true,
                        cells: [new Cell({ cellType: CellType.Indent }), new Cell({ isDataCell: true, visible: true })]
                    });
                    for (let i = 0, len = gObj.groupSettings.columns.length; i < len; i++) {
                        detailRow.appendChild(createElement('td', { className: 'e-indentcell' }));
                        row.cells.unshift(new Cell({ cellType: CellType.Indent }));
                    }
                    detailRow.appendChild(createElement('td', { className: 'e-detailindentcell' }));
                    detailRow.appendChild(detailCell);
                    tr.parentNode.insertBefore(detailRow, tr.nextSibling);
                    if (gObj.detailTemplate) {
                        appendChildren(detailCell, gObj.getDetailTemplate()(data, gObj, 'detailTemplate'));
                    }
                    else {
                        gObj.childGrid[parent] = {
                            parentID: gObj.element.id,
                            parentPrimaryKeys: gObj.getPrimaryKeyFieldNames(),
                            parentKeyField: gObj.childGrid.queryString,
                            parentKeyFieldValue: data[gObj.childGrid.queryString],
                            parentRowData: data
                        };
                        let grid = new Grid(gObj.childGrid);
                        let modules = grid.getInjectedModules();
                        let injectedModues = gObj.getInjectedModules();
                        if (!modules || modules.length !== injectedModues.length) {
                            grid.setInjectedModules(injectedModues);
                        }
                        let gridElem = createElement('div', {
                            id: 'child' + parents(tr, 'e-grid').length +
                                '_grid' + tr.rowIndex + getUid('')
                        });
                        detailCell.appendChild(gridElem);
                        grid.appendTo(gridElem);
                    }
                    detailRow.appendChild(detailCell);
                    tr.parentNode.insertBefore(detailRow, tr.nextSibling);
                    let idx;
                    this.parent.getRowsObject().some((r, rIndex) => { idx = rIndex; return r.uid === uid; });
                    gObj.getRows().splice(tr.rowIndex + 1, 0, detailRow);
                    this.parent.getRowsObject().splice(idx + 1, 0, row);
                    gObj.trigger(detailDataBound, { detailElement: detailCell, data: data });
                    gObj.notify(detailDataBound, { rows: this.parent.getRowsObject() });
                }
                classList(target, ['e-detailrowexpand'], ['e-detailrowcollapse']);
                classList(target.firstElementChild, ['e-dtdiagonaldown', 'e-icon-gdownarrow'], ['e-dtdiagonalright', 'e-icon-grightarrow']);
                this.parent.getRowsObject()[tr.rowIndex].isExpand = true;
                this.aria.setExpand(target, true);
            }
            else {
                if (this.isDetailRow(nextRow)) {
                    nextRow.style.display = 'none';
                }
                classList(target, ['e-detailrowcollapse'], ['e-detailrowexpand']);
                classList(target.firstElementChild, ['e-dtdiagonalright', 'e-icon-grightarrow'], ['e-dtdiagonaldown', 'e-icon-gdownarrow']);
                this.parent.getRowsObject()[tr.rowIndex].isExpand = false;
                this.aria.setExpand(target, false);
            }
        }
    }
    isDetailRow(row) {
        return row && row.classList.contains('e-detailrow');
    }
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(click, this.clickHandler);
        this.parent.off(destroy, this.destroy);
        this.parent.off(keyPressed, this.keyPressHandler);
    }
    getTDfromIndex(index, className) {
        let tr = this.parent.getDataRows()[index];
        if (tr && tr.querySelector(className)) {
            return tr.querySelector(className);
        }
        return null;
    }
    /**
     * Expands a detail row with the given target.
     * @param  {Element} target - Defines the collapsed element to expand.
     * @return {void}
     */
    expand(target) {
        if (!isNaN(target)) {
            target = this.getTDfromIndex(target, '.e-detailrowcollapse');
        }
        if (target && target.classList.contains('e-detailrowcollapse')) {
            this.toogleExpandcollapse(target);
        }
    }
    /**
     * Collapses a detail row with the given target.
     * @param  {Element} target - Defines the expanded element to collapse.
     * @return {void}
     */
    collapse(target) {
        if (!isNaN(target)) {
            target = this.getTDfromIndex(target, '.e-detailrowexpand');
        }
        if (target && target.classList.contains('e-detailrowexpand')) {
            this.toogleExpandcollapse(target);
        }
    }
    /**
     * Expands all the detail rows of the Grid.
     * @return {void}
     */
    expandAll() {
        this.expandCollapse(true);
    }
    /**
     * Collapses all the detail rows of the Grid.
     * @return {void}
     */
    collapseAll() {
        this.expandCollapse(false);
    }
    expandCollapse(isExpand) {
        let td;
        let rows = this.parent.getDataRows();
        for (let i = 0, len = rows.length; i < len; i++) {
            td = rows[i].querySelector('.e-detailrowcollapse, .e-detailrowexpand');
            isExpand ? this.expand(td) : this.collapse(td);
        }
    }
    keyPressHandler(e) {
        let gObj = this.parent;
        switch (e.action) {
            case 'ctrlDownArrow':
                this.expandAll();
                break;
            case 'ctrlUpArrow':
                this.collapseAll();
                break;
            case 'altUpArrow':
            case 'altDownArrow':
                let selected = gObj.allowSelection ? gObj.getSelectedRowIndexes() : [];
                if (selected.length) {
                    let dataRow = gObj.getDataRows()[selected[selected.length - 1]];
                    let td = dataRow.querySelector('.e-detailrowcollapse, .e-detailrowexpand');
                    e.action === 'altDownArrow' ? this.expand(td) : this.collapse(td);
                }
                break;
            case 'enter':
                if (this.parent.isEdit) {
                    return;
                }
                let element = this.focus.getFocusedElement();
                if (!e.target.classList.contains('e-detailrowcollapse') &&
                    !e.target.classList.contains('e-detailrowexpand')) {
                    break;
                }
                this.toogleExpandcollapse(element);
                break;
        }
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'detailRow';
    }
}

/**
 * The `Toolbar` module is used to handle ToolBar actions.
 * @hidden
 */
class Toolbar$1 {
    constructor(parent, serviceLocator) {
        this.predefinedItems = {};
        this.items = ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Print', 'Search',
            'ColumnChooser', 'PdfExport', 'ExcelExport', 'CsvExport', 'WordExport'];
        this.parent = parent;
        this.gridID = parent.element.id;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    render() {
        this.l10n = this.serviceLocator.getService('localization');
        let preItems = ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Print',
            'PdfExport', 'ExcelExport', 'WordExport', 'CsvExport'];
        for (let item of preItems) {
            let itemStr = item.toLowerCase();
            let localeName = itemStr[0].toUpperCase() + itemStr.slice(1);
            this.predefinedItems[item] = {
                id: this.gridID + '_' + itemStr, prefixIcon: 'e-' + itemStr,
                text: this.l10n.getConstant(localeName), tooltipText: this.l10n.getConstant(localeName)
            };
        }
        this.predefinedItems.Search = {
            id: this.gridID + '_search',
            template: '<div class="e-input-group e-search" role="search">\
            <input id="' + this.gridID + '_searchbar" class="e-input" name="input" type="search" \
            placeholder= \"' + this.l10n.getConstant('Search') + '\"/>\
            <span id="' + this.gridID + '_searchbutton" class="e-input-group-icon e-search-icon e-icons" \
            tabindex="-1" title="Search In" aria-label= "search"></span> \
            </div>',
            tooltipText: this.l10n.getConstant('Search'), align: 'right', cssClass: 'e-search-wrapper'
        };
        this.predefinedItems.ColumnChooser = {
            id: this.gridID + '_' + 'columnchooser', cssClass: 'e-cc e-ccdiv e-cc-toolbar', suffixIcon: 'e-' + 'columnchooser-btn',
            text: 'Columns', tooltipText: 'columns', align: 'right',
        };
        this.createToolbar();
    }
    /**
     * Gets the toolbar of the Grid.
     * @return {Element}
     * @hidden
     */
    getToolbar() {
        return this.toolbar.element;
    }
    /**
     * Destroys the ToolBar.
     * @method destroy
     * @return {void}
     */
    destroy() {
        if (!this.toolbar.isDestroyed) {
            if (!this.toolbar.element) {
                this.parent.destroyTemplate(['toolbarTemplate']);
            }
            else {
                this.toolbar.destroy();
            }
            this.unWireEvent();
            this.removeEventListener();
            remove(this.element);
        }
    }
    createToolbar() {
        let items = this.getItems();
        this.toolbar = new Toolbar({
            items: items,
            clicked: this.toolbarClickHandler.bind(this),
            enablePersistence: this.parent.enablePersistence,
            enableRtl: this.parent.enableRtl
        });
        let viewStr = 'viewContainerRef';
        let registerTemp = 'registeredTemplate';
        if (this.parent[viewStr]) {
            this.toolbar[registerTemp] = {};
            this.toolbar[viewStr] = this.parent[viewStr];
        }
        this.element = createElement('div', { id: this.gridID + '_toolbarItems' });
        if (this.parent.toolbarTemplate) {
            if (typeof (this.parent.toolbarTemplate) === 'string') {
                this.toolbar.appendTo(this.parent.toolbarTemplate);
                this.element = this.toolbar.element;
            }
            else {
                appendChildren(this.element, templateCompiler(this.parent.toolbarTemplate)({}, this.parent, 'toolbarTemplate'));
            }
        }
        else {
            this.toolbar.appendTo(this.element);
        }
        this.parent.element.insertBefore(this.element, this.parent.getHeaderContent());
        this.searchElement = this.element.querySelector('#' + this.gridID + '_searchbar');
        this.wireEvent();
        this.refreshToolbarItems();
        if (this.parent.searchSettings) {
            this.updateSearchBox();
        }
    }
    refreshToolbarItems(args) {
        let gObj = this.parent;
        let enableItems = [];
        let disableItems = [];
        let edit = gObj.editSettings;
        let hasData = gObj.currentViewData && gObj.currentViewData.length;
        edit.allowAdding ? enableItems.push(this.gridID + '_add') : disableItems.push(this.gridID + '_add');
        edit.allowEditing && hasData ? enableItems.push(this.gridID + '_edit') : disableItems.push(this.gridID + '_edit');
        edit.allowDeleting && hasData ? enableItems.push(this.gridID + '_delete') : disableItems.push(this.gridID + '_delete');
        if (gObj.editSettings.mode === 'Batch') {
            if (gObj.element.querySelectorAll('.e-updatedtd').length && (edit.allowAdding || edit.allowEditing)) {
                enableItems.push(this.gridID + '_update');
                enableItems.push(this.gridID + '_cancel');
            }
            else {
                disableItems.push(this.gridID + '_update');
                disableItems.push(this.gridID + '_cancel');
            }
        }
        else {
            if (gObj.isEdit && (edit.allowAdding || edit.allowEditing)) {
                enableItems = [this.gridID + '_update', this.gridID + '_cancel'];
                disableItems = [this.gridID + '_add', this.gridID + '_edit', this.gridID + '_delete'];
            }
            else {
                disableItems.push(this.gridID + '_update');
                disableItems.push(this.gridID + '_cancel');
            }
        }
        this.enableItems(enableItems, true);
        this.enableItems(disableItems, false);
    }
    getItems() {
        let items = [];
        let toolbarItems = this.parent.toolbar || [];
        if (typeof (this.parent.toolbar) === 'string') {
            return [];
        }
        for (let item of toolbarItems) {
            switch (typeof item) {
                case 'number':
                    items.push(this.getItemObject(this.items[item]));
                    break;
                case 'string':
                    items.push(this.getItemObject(item));
                    break;
                default:
                    items.push(this.getItem(item));
            }
        }
        return items;
    }
    getItem(itemObject) {
        let item = this.predefinedItems[itemObject.text];
        return item ? extend(item, item, itemObject) : itemObject;
    }
    getItemObject(itemName) {
        return this.predefinedItems[itemName] || { text: itemName, id: this.gridID + '_' + itemName };
    }
    /**
     * Enables or disables ToolBar items.
     * @param {string[]} items - Defines the collection of itemID of ToolBar items.
     * @param {boolean} isEnable - Defines the items to be enabled or disabled.
     * @return {void}
     * @hidden
     */
    enableItems(items, isEnable) {
        for (let item of items) {
            let element = this.element.querySelector('#' + item);
            if (element) {
                this.toolbar.enableItems(element.parentElement, isEnable);
            }
        }
    }
    toolbarClickHandler(args) {
        let gObj = this.parent;
        let gID = this.gridID;
        extend(args, { cancel: false });
        gObj.trigger(toolbarClick, args);
        if (args.cancel) {
            return;
        }
        switch (!isNullOrUndefined(args.item) && args.item.id) {
            case gID + '_print':
                gObj.print();
                break;
            case gID + '_edit':
                gObj.startEdit();
                break;
            case gID + '_update':
                gObj.endEdit();
                break;
            case gID + '_cancel':
                gObj.closeEdit();
                break;
            case gID + '_add':
                gObj.addRecord();
                break;
            case gID + '_delete':
                gObj.deleteRecord();
                break;
            case gID + '_search':
                if (args.originalEvent.target.id === gID + '_searchbutton') {
                    this.search();
                }
                break;
            case gID + '_columnchooser':
                let tarElement = this.parent.element.querySelector('.e-ccdiv');
                let y = tarElement.getBoundingClientRect().top;
                let x = tarElement.getBoundingClientRect().left;
                let targetEle = args.originalEvent.target;
                y = tarElement.getBoundingClientRect().top + tarElement.offsetTop;
                gObj.createColumnchooser(x, y, targetEle);
                break;
        }
    }
    modelChanged(e) {
        if (e.module === 'edit') {
            this.refreshToolbarItems();
        }
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName() || !this.parent.toolbar) {
            return;
        }
        if (this.element) {
            remove(this.element);
        }
        this.render();
    }
    keyUpHandler(e) {
        if (e.keyCode === 13) {
            this.search();
        }
    }
    search() {
        this.parent.search(this.searchElement.value);
    }
    updateSearchBox() {
        if (this.searchElement) {
            this.searchElement.value = this.parent.searchSettings.key;
        }
    }
    wireEvent() {
        if (this.searchElement) {
            this.searchBoxObj = new SearchBox(this.searchElement);
            EventHandler.add(this.searchElement, 'keyup', this.keyUpHandler, this);
            this.searchBoxObj.wireEvent();
        }
    }
    unWireEvent() {
        if (this.searchElement) {
            EventHandler.remove(this.searchElement, 'keyup', this.keyUpHandler);
            this.searchBoxObj.unWireEvent();
        }
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialEnd, this.render, this);
        this.parent.on(uiUpdate, this.onPropertyChanged, this);
        this.parent.on(inBoundModelChanged, this.updateSearchBox.bind(this));
        this.parent.on(modelChanged, this.refreshToolbarItems, this);
        this.parent.on(toolbarRefresh, this.refreshToolbarItems, this);
        this.parent.on(inBoundModelChanged, this.modelChanged, this);
        this.parent.on(dataBound, this.refreshToolbarItems, this);
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialEnd, this.render);
        this.parent.off(uiUpdate, this.onPropertyChanged);
        this.parent.off(inBoundModelChanged, this.updateSearchBox);
        this.parent.off(modelChanged, this.refreshToolbarItems);
        this.parent.off(toolbarRefresh, this.refreshToolbarItems);
        this.parent.off(inBoundModelChanged, this.modelChanged);
        this.parent.off(dataBound, this.refreshToolbarItems);
    }
    /**
     * For internal use only - Get the module name.
     */
    getModuleName() {
        return 'toolbar';
    }
}

/**
 * Footer module is used to render grid content
 * @hidden
 */
class FooterRenderer extends ContentRender {
    constructor(gridModule, serviceLocator) {
        super(gridModule, serviceLocator);
        this.aggregates = {};
        this.parent = gridModule;
        this.locator = serviceLocator;
        this.modelGenerator = new SummaryModelGenerator(this.parent);
        this.addEventListener();
    }
    /**
     * The function is used to render grid footer div
     */
    renderPanel() {
        let div = createElement('div', { className: 'e-gridfooter' });
        let innerDiv = createElement('div', { className: 'e-summarycontent' });
        let movableContent = innerDiv;
        if (this.parent.getFrozenColumns()) {
            let fDiv = createElement('div', { className: 'e-frozenfootercontent' });
            let mDiv = createElement('div', { className: 'e-movablefootercontent' });
            innerDiv.appendChild(fDiv);
            innerDiv.appendChild(mDiv);
            this.frozenContent = fDiv;
            this.movableContent = mDiv;
            movableContent = mDiv;
        }
        if (Browser.isDevice) {
            movableContent.style.overflowX = 'scroll';
        }
        div.appendChild(innerDiv);
        this.setPanel(div);
        if (this.parent.getPager() != null) {
            this.parent.element.insertBefore(div, this.parent.getPager());
        }
        else {
            this.parent.element.appendChild(div);
        }
    }
    /**
     * The function is used to render grid footer table
     */
    renderTable() {
        let contentDiv = this.getPanel();
        let innerDiv = this.createContentTable('_footer_table');
        let table = innerDiv.querySelector('.e-table');
        let tFoot = createElement('tfoot');
        table.appendChild(tFoot);
        if (this.parent.getFrozenColumns()) {
            let freezeTable = table.cloneNode(true);
            this.frozenContent.appendChild(freezeTable);
            this.freezeTable = freezeTable;
            this.movableContent.appendChild(table);
            remove(table.querySelector('colgroup'));
            let colGroup = ((this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('colgroup')).cloneNode(true));
            table.insertBefore(colGroup, table.querySelector('tbody'));
            this.setColGroup(colGroup);
        }
        this.setTable(table);
    }
    renderSummaryContent(e, table, cStart, cEnd) {
        let input = this.parent.dataSource instanceof Array ? this.parent.dataSource : this.parent.currentViewData;
        let summaries = this.modelGenerator.getData();
        let dummies = isNullOrUndefined(cStart) ? this.modelGenerator.getColumns() :
            this.modelGenerator.getColumns(cStart, cEnd);
        let rows = isNullOrUndefined(cStart) ? this.modelGenerator.generateRows(input, e || this.aggregates) :
            this.modelGenerator.generateRows(input, e || this.aggregates, cStart, cEnd);
        let fragment = document.createDocumentFragment();
        let rowrenderer = new RowRenderer(this.locator, null, this.parent);
        rowrenderer.element = createElement('TR', { className: 'e-summaryrow' });
        for (let srow = 0, len = summaries.length; srow < len; srow++) {
            let row = rows[srow];
            if (!row) {
                continue;
            }
            let tr = rowrenderer.render(row, dummies);
            fragment.appendChild(tr);
        }
        table.tFoot.appendChild(fragment);
        this.aggregates = e;
    }
    refresh(e) {
        if (this.parent.getFrozenColumns()) {
            remove(this.getPanel());
            this.renderPanel();
            this.renderTable();
            this.freezeTable.tFoot.innerHTML = '';
            this.renderSummaryContent(e, this.freezeTable, 0, this.parent.getFrozenColumns());
        }
        this.getTable().tFoot.innerHTML = '';
        this.renderSummaryContent(e, this.getTable(), this.parent.getFrozenColumns());
        // check freeze content have no row case
        if (this.parent.getFrozenColumns()) {
            let frozenDiv = this.frozenContent;
            if (!frozenDiv.offsetHeight) {
                frozenDiv.style.height = this.getTable().offsetHeight + 'px';
            }
        }
        this.onScroll();
    }
    refreshCol() {
        // frozen table 
        let mheaderCol;
        let fheaderCol = mheaderCol = this.parent.element.querySelector('.e-gridheader').querySelector('colgroup').cloneNode(true);
        if (this.parent.getFrozenColumns()) {
            mheaderCol = renderMovable(fheaderCol, this.parent.getFrozenColumns());
            this.freezeTable.replaceChild(fheaderCol, this.freezeTable.querySelector('colGroup'));
        }
        this.getTable().replaceChild(mheaderCol, this.getColGroup());
        this.setColGroup(mheaderCol);
    }
    onWidthChange(args) {
        this.getColFromIndex(args.index).style.width = formatUnit(args.width);
        if (this.parent.allowResizing && args.module === 'resize') {
            this.updateFooterTableWidth(this.getTable());
        }
    }
    onScroll(e = { left: this.parent.getContent().firstChild.scrollLeft }) {
        this.getTable().parentElement.scrollLeft = e.left;
    }
    getColFromIndex(index) {
        let fCol = this.parent.getFrozenColumns();
        if (fCol && fCol > index) {
            return this.freezeTable.querySelector('colGroup').children[index];
        }
        return this.getColGroup().children[index - fCol];
    }
    columnVisibilityChanged() {
        this.refresh();
    }
    addEventListener() {
        this.parent.on(colGroupRefresh, this.refreshCol, this);
        this.parent.on(columnWidthChanged, this.onWidthChange, this);
        this.parent.on(scroll, this.onScroll, this);
        this.parent.on(columnVisibilityChanged, this.columnVisibilityChanged, this);
    }
    removeEventListener() {
        this.parent.off(colGroupRefresh, this.refreshCol);
        this.parent.off(columnWidthChanged, this.onWidthChange);
        this.parent.off(scroll, this.onScroll);
        this.parent.off(columnVisibilityChanged, this.columnVisibilityChanged);
    }
    updateFooterTableWidth(tFoot) {
        let tHead = this.parent.getHeaderTable();
        if (tHead && tFoot) {
            tFoot.style.width = tHead.style.width;
        }
    }
}

/**
 * SummaryCellRenderer class which responsible for building summary cell content.
 * @hidden
 */
class SummaryCellRenderer extends CellRenderer {
    constructor() {
        super(...arguments);
        this.element = createElement('TD', { className: 'e-summarycell', attrs: { role: 'gridcell', tabindex: '-1' } });
    }
    getValue(field, data, column) {
        let key;
        key = !isNullOrUndefined(column.type) ?
            column.field + ' - ' + (typeof column.type === 'string' ? column.type.toLowerCase() : '') : column.columnName;
        return data[column.columnName] ? data[column.columnName][key] : '';
    }
    evaluate(node, cell, data, attributes$$1) {
        let column = cell.column;
        if (!(column.footerTemplate || column.groupFooterTemplate || column.groupCaptionTemplate)) {
            return true;
        }
        let tempObj = column.getTemplate(cell.cellType);
        appendChildren(node, tempObj.fn(data[column.columnName], this.parent, tempObj.property));
        return false;
    }
}

/**
 * Summary Action controller.
 */
class Aggregate {
    constructor(parent, locator) {
        this.parent = parent;
        this.locator = locator;
        this.addEventListener();
    }
    getModuleName() {
        return 'aggregate';
    }
    initiateRender() {
        let cellFac = this.locator.getService('cellRendererFactory');
        let instance = new SummaryCellRenderer(this.parent, this.locator);
        [CellType.Summary, CellType.CaptionSummary, CellType.GroupSummary].forEach((type) => cellFac.addCellRenderer(type, instance));
        this.footerRenderer = new FooterRenderer(this.parent, this.locator);
        this.footerRenderer.renderPanel();
        this.footerRenderer.renderTable();
        this.locator.register('footerRenderer', this.footerRenderer);
        let fn = () => {
            this.prepareSummaryInfo();
            this.parent.off(dataReady, fn);
        };
        this.parent.on(dataReady, fn, this);
        this.parent.on(dataReady, this.footerRenderer.refresh, this.footerRenderer);
    }
    prepareSummaryInfo() {
        summaryIterator(this.parent.aggregates, (column) => {
            let dataColumn = this.parent.getColumnByField(column.field) || {};
            let type = dataColumn.type;
            column.setPropertiesSilent({ format: this.getFormatFromType(column.format, type) });
            column.setFormatter();
            column.setPropertiesSilent({ columnName: column.columnName || column.field });
        });
    }
    getFormatFromType(format, type) {
        if (isNullOrUndefined(type) || typeof format !== 'string') {
            return format;
        }
        let obj;
        switch (type) {
            case 'number':
                obj = { format: format };
                break;
            case 'date':
                obj = { type: type, skeleton: format };
                break;
            case 'datetime':
                obj = { type: 'dateTime', skeleton: format };
                break;
        }
        return obj;
    }
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        if (isNullOrUndefined(this.footerRenderer)) {
            this.initiateRender();
        }
        this.prepareSummaryInfo();
        this.footerRenderer.refresh();
        let cModel = new CaptionSummaryModelGenerator(this.parent);
        let gModel = new GroupSummaryModelGenerator(this.parent);
        if (gModel.getData().length !== 0 || !cModel.isEmpty()) {
            this.parent.notify(modelChanged, {});
        }
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialEnd, this.initiateRender, this);
        this.parent.on(uiUpdate, this.onPropertyChanged, this);
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.footerRenderer.removeEventListener();
        this.parent.off(initialEnd, this.initiateRender);
        this.parent.off(dataReady, this.footerRenderer.refresh);
        this.parent.off(uiUpdate, this.onPropertyChanged);
    }
    destroy() {
        this.removeEventListener();
        remove(this.parent.element.querySelector('.e-gridfooter'));
    }
}
/**
 * @private
 */
function summaryIterator(aggregates, callback) {
    aggregates.forEach((row) => {
        row.columns.forEach((column) => {
            callback(column, row);
        });
    });
}

/**
 * InterSectionObserver - class watch whether it enters the viewport.
 * @hidden
 */
class InterSectionObserver {
    constructor(element, options) {
        this.fromWheel = false;
        this.touchMove = false;
        this.options = {};
        this.sentinelInfo = {
            'up': {
                check: (rect, info) => {
                    let top = rect.top - this.containerRect.top;
                    info.entered = top >= 0;
                    return top + (this.options.pageHeight / 2) >= 0;
                },
                axis: 'Y'
            },
            'down': {
                check: (rect, info) => {
                    let cHeight = this.options.container.clientHeight;
                    let top = rect.bottom;
                    info.entered = rect.bottom <= this.containerRect.bottom;
                    return top - (this.options.pageHeight / 2) <= this.options.pageHeight / 2;
                }, axis: 'Y'
            },
            'right': {
                check: (rect, info) => {
                    let right = rect.right;
                    info.entered = right < this.containerRect.right;
                    return right - this.containerRect.width <= this.containerRect.right;
                }, axis: 'X'
            },
            'left': {
                check: (rect, info) => {
                    let left = rect.left;
                    info.entered = left > 0;
                    return left + this.containerRect.width >= this.containerRect.left;
                }, axis: 'X'
            }
        };
        this.element = element;
        this.options = options;
    }
    observe(callback, onEnterCallback) {
        this.containerRect = this.options.container.getBoundingClientRect();
        EventHandler.add(this.options.container, 'wheel', () => this.fromWheel = true, this);
        EventHandler.add(this.options.container, 'scroll', this.virtualScrollHandler(callback, onEnterCallback), this);
    }
    check(direction) {
        let info = this.sentinelInfo[direction];
        return info.check(this.element.getBoundingClientRect(), info);
    }
    virtualScrollHandler(callback, onEnterCallback) {
        let prevTop = 0;
        let prevLeft = 0;
        let debounced100 = debounce(callback, 100);
        let debounced50 = debounce(callback, 50);
        return (e) => {
            let top = e.target.scrollTop;
            let left = e.target.scrollLeft;
            let direction = prevTop < top ? 'down' : 'up';
            direction = prevLeft === left ? direction : prevLeft < left ? 'right' : 'left';
            prevTop = top;
            prevLeft = left;
            let current = this.sentinelInfo[direction];
            if (this.options.axes.indexOf(current.axis) === -1) {
                return;
            }
            let check = this.check(direction);
            if (current.entered) {
                onEnterCallback(this.element, current, direction, { top: top, left: left });
            }
            if (check) {
                let fn = this.fromWheel ? this.options.debounceEvent ? debounced100 : callback : debounced100;
                if (current.axis === 'X') {
                    fn = debounced50;
                }
                fn({ direction: direction, sentinel: current, offset: { top: top, left: left } });
            }
            this.fromWheel = false;
        };
    }
    setPageHeight(value) {
        this.options.pageHeight = value;
    }
}

/**
 * Content module is used to render grid content
 */
class VirtualRowModelGenerator {
    constructor(parent) {
        this.cOffsets = {};
        this.cache = {};
        this.data = {};
        this.groups = {};
        this.parent = parent;
        this.model = this.parent.pageSettings;
        this.rowModelGenerator = this.parent.allowGrouping ? new GroupModelGenerator(this.parent) : new RowModelGenerator(this.parent);
    }
    generateRows(data, notifyArgs) {
        let info = notifyArgs.virtualInfo = notifyArgs.virtualInfo || this.getData();
        let xAxis = info.sentinelInfo && info.sentinelInfo.axis === 'X';
        let page = !xAxis && info.loadNext && !info.loadSelf ? info.nextInfo.page : info.page;
        let result = [];
        let center = ~~(this.model.pageSize / 2);
        let indexes = this.getBlockIndexes(page);
        let loadedBlocks = [];
        this.checkAndResetCache(notifyArgs.requestType);
        if (this.parent.enableColumnVirtualization) {
            info.blockIndexes.forEach((value) => {
                if (this.isBlockAvailable(value)) {
                    this.cache[value] = this.rowModelGenerator.refreshRows(this.cache[value]);
                }
            });
        }
        info.blockIndexes.forEach((value) => {
            if (!this.isBlockAvailable(value)) {
                let rows = this.rowModelGenerator.generateRows(data, {
                    virtualInfo: info, startIndex: this.getStartIndex(value, data)
                });
                let median = ~~Math.max(rows.length, this.model.pageSize) / 2;
                if (!this.isBlockAvailable(indexes[0])) {
                    this.cache[indexes[0]] = rows.slice(0, median);
                }
                if (!this.isBlockAvailable(indexes[1])) {
                    this.cache[indexes[1]] = rows.slice(median);
                }
            }
            if (this.parent.groupSettings.columns.length && !xAxis && this.cache[value]) {
                this.cache[value] = this.updateGroupRow(this.cache[value], value);
            }
            result.push(...this.cache[value]);
            if (this.isBlockAvailable(value)) {
                loadedBlocks.push(value);
            }
        });
        info.blockIndexes = loadedBlocks;
        let grouping = 'records';
        if (this.parent.allowGrouping) {
            this.parent.currentViewData[grouping] = result.map((m) => m.data);
        }
        else {
            this.parent.currentViewData = result.map((m) => m.data);
        }
        return result;
    }
    getBlockIndexes(page) {
        return [page + (page - 1), page * 2];
    }
    getPage(block) {
        return block % 2 === 0 ? block / 2 : (block + 1) / 2;
    }
    isBlockAvailable(value) {
        return value in this.cache;
    }
    getData() {
        return {
            page: this.model.currentPage,
            blockIndexes: this.getBlockIndexes(this.model.currentPage),
            direction: 'down',
            columnIndexes: this.parent.getColumnIndexesInView()
        };
    }
    getStartIndex(blk, data, full = true) {
        let page = this.getPage(blk);
        let even = blk % 2 === 0;
        let index = (page - 1) * this.model.pageSize;
        return full || !even ? index : index + ~~(this.model.pageSize / 2);
    }
    getColumnIndexes(content = this.parent.getHeaderContent().firstChild) {
        let indexes = [];
        let sLeft = content.scrollLeft | 0;
        let keys = Object.keys(this.cOffsets);
        let cWidth = content.getBoundingClientRect().width;
        sLeft = Math.min(this.cOffsets[keys.length - 1] - cWidth, sLeft);
        let calWidth = Browser.isDevice ? 2 * cWidth : cWidth / 2;
        let left = sLeft + cWidth + (sLeft === 0 ? calWidth : 0);
        keys.some((offset, indx, input) => {
            let iOffset = Number(offset);
            let offsetVal = this.cOffsets[offset];
            let border = sLeft - calWidth <= offsetVal && left + calWidth >= offsetVal;
            if (border) {
                indexes.push(iOffset);
            }
            return left + calWidth < offsetVal;
        });
        return indexes;
    }
    checkAndResetCache(action) {
        let clear = ['paging', 'refresh', 'sorting', 'filtering', 'searching', 'grouping', 'ungrouping', 'reorder']
            .some((value) => action === value);
        if (clear) {
            this.cache = {};
            this.data = {};
            this.groups = {};
        }
        return clear;
    }
    refreshColOffsets() {
        let col = 0;
        this.cOffsets = {};
        let gLen = this.parent.groupSettings.columns.length;
        let cols = this.parent.columns;
        let cLen = cols.length;
        let isVisible = (column) => column.visible &&
            (!this.parent.groupSettings.showGroupedColumn ? this.parent.groupSettings.columns.indexOf(column.field) < 0 : column.visible);
        this.parent.groupSettings.columns.forEach((c, n) => this.cOffsets[n] = (this.cOffsets[n - 1] | 0) + 30);
        Array.apply(null, Array(cLen)).map(() => col++).forEach((block, i) => {
            block = block + gLen;
            this.cOffsets[block] = (this.cOffsets[block - 1] | 0) + (isVisible(cols[i]) ? parseInt(cols[i].width, 10) : 0);
        });
    }
    updateGroupRow(current, block) {
        let currentFirst = current[0];
        let rows = [];
        Object.keys(this.cache).forEach((key) => {
            if (Number(key) < block) {
                rows = [...rows, ...this.cache[key]];
            }
        });
        if ((currentFirst && currentFirst.isDataRow) || block % 2 === 0) {
            return current;
        }
        return this.iterateGroup(current, rows);
    }
    iterateGroup(current, rows) {
        let currentFirst = current[0];
        let offset = 0;
        if (currentFirst && currentFirst.isDataRow) {
            return current;
        }
        let isPresent = current.some((row) => {
            return rows.some((oRow, index) => {
                let res = oRow && oRow.data.field !== undefined && oRow.data.field === row.data.field &&
                    oRow.data.key === row.data.key;
                if (res) {
                    offset = index;
                }
                return res;
            });
        });
        if (isPresent) {
            current.shift();
            current = this.iterateGroup(current, rows.slice(offset));
        }
        return current;
    }
    getRows() {
        let rows = [];
        Object.keys(this.cache).forEach((key) => rows = [...rows, ...this.cache[key]]);
        return rows;
    }
}

/**
 * VirtualContentRenderer
 * @hidden
 */
class VirtualContentRenderer extends ContentRender {
    constructor(parent, locator) {
        super(parent, locator);
        this.prevHeight = 0;
        this.preventEvent = false;
        this.actions = ['filtering', 'searching', 'grouping', 'ungrouping'];
        this.offsets = {};
        this.tmpOffsets = {};
        this.virtualEle = new VirtualElementHandler();
        this.offsetKeys = [];
        this.isFocused = false;
        this.locator = locator;
        this.eventListener('on');
        this.vgenerator = this.generator;
    }
    renderTable() {
        this.header = this.locator.getService('rendererFactory').getRenderer(RenderType.Header);
        super.renderTable();
        this.virtualEle.table = this.getTable();
        this.virtualEle.content = this.content = this.getPanel().firstChild;
        this.virtualEle.renderWrapper();
        this.virtualEle.renderPlaceHolder();
        this.virtualEle.wrapper.style.position = 'absolute';
        let debounceEvent = (this.parent.dataSource instanceof DataManager && !this.parent.dataSource.dataSource.offline);
        let opt = {
            container: this.content, pageHeight: this.getBlockHeight() * 2, debounceEvent: debounceEvent,
            axes: this.parent.enableColumnVirtualization ? ['X', 'Y'] : ['Y']
        };
        this.observer = new InterSectionObserver(this.virtualEle.wrapper, opt);
    }
    renderEmpty(tbody) {
        this.getTable().appendChild(tbody);
        this.virtualEle.adjustTable(0, 0);
    }
    scrollListener(scrollArgs) {
        if (this.preventEvent || this.parent.isDestroyed) {
            this.preventEvent = false;
            return;
        }
        this.isFocused = this.content === closest(document.activeElement, '.e-content') || this.content === document.activeElement;
        let info = scrollArgs.sentinel;
        let viewInfo = this.getInfoFromView(scrollArgs.direction, info, scrollArgs.offset);
        if (this.prevInfo && ((info.axis === 'Y' && this.prevInfo.blockIndexes.toString() === viewInfo.blockIndexes.toString())
            || (info.axis === 'X' && this.prevInfo.columnIndexes.toString() === viewInfo.columnIndexes.toString()))) {
            return;
        }
        this.parent.setColumnIndexesInView(this.parent.enableColumnVirtualization ? viewInfo.columnIndexes : []);
        this.parent.pageSettings.currentPage = viewInfo.loadNext && !viewInfo.loadSelf ? viewInfo.nextInfo.page : viewInfo.page;
        this.parent.notify(viewInfo.event, { requestType: 'virtualscroll', virtualInfo: viewInfo });
    }
    block(blk) {
        return this.vgenerator.isBlockAvailable(blk);
    }
    getInfoFromView(direction, info, e) {
        let tempBlocks = [];
        let infoType = { direction: direction, sentinelInfo: info, offsets: e };
        infoType.page = this.getPageFromTop(e.top, infoType);
        infoType.blockIndexes = tempBlocks = this.vgenerator.getBlockIndexes(infoType.page);
        infoType.loadSelf = !this.vgenerator.isBlockAvailable(tempBlocks[infoType.block]);
        let blocks = this.ensureBlocks(infoType);
        infoType.blockIndexes = blocks;
        infoType.loadNext = !blocks.filter((val) => tempBlocks.indexOf(val) === -1)
            .every(this.block.bind(this));
        infoType.event = (infoType.loadNext || infoType.loadSelf) ? modelChanged : refreshVirtualBlock;
        infoType.nextInfo = infoType.loadNext ? { page: Math.max(1, infoType.page + (direction === 'down' ? 1 : -1)) } : {};
        infoType.columnIndexes = info.axis === 'X' ? this.vgenerator.getColumnIndexes() : this.parent.getColumnIndexesInView();
        if (this.parent.enableColumnVirtualization && info.axis === 'X') {
            infoType.event = refreshVirtualBlock;
        }
        return infoType;
    }
    ensureBlocks(info) {
        let index = info.blockIndexes[info.block];
        let mIdx;
        let old = index;
        let max = Math.max;
        let indexes = info.direction === 'down' ? [max(index, 1), ++index, ++index] : [max(index - 1, 1), index, index + 1];
        indexes = indexes.filter((val, ind) => indexes.indexOf(val) === ind);
        if (this.prevInfo.blockIndexes.toString() === indexes.toString()) {
            return indexes;
        }
        if (info.loadSelf || (info.direction === 'down' && this.isEndBlock(old))) {
            indexes = this.vgenerator.getBlockIndexes(info.page);
        }
        indexes.some((val, ind) => {
            let result = val === this.getTotalBlocks();
            if (result) {
                mIdx = ind;
            }
            return result;
        });
        if (mIdx !== undefined) {
            indexes = indexes.slice(0, mIdx + 1);
            if (info.block === 0 && indexes.length === 1 && this.vgenerator.isBlockAvailable(indexes[0] - 1)) {
                indexes = [indexes[0] - 1, indexes[0]];
            }
        }
        return indexes;
    }
    appendContent(target, newChild, e) {
        let info = e.virtualInfo;
        this.prevInfo = this.prevInfo || e.virtualInfo;
        let cBlock = (info.columnIndexes[0]) - 1;
        let cOffset = this.getColumnOffset(cBlock);
        let width;
        let blocks = info.blockIndexes;
        if (this.parent.groupSettings.columns.length) {
            this.refreshOffsets();
        }
        let translate = this.getTranslateY(this.content.scrollTop, this.content.getBoundingClientRect().height, info);
        this.virtualEle.adjustTable(cOffset, translate);
        if (this.parent.enableColumnVirtualization) {
            this.header.virtualEle.adjustTable(cOffset, 0);
        }
        if (this.parent.enableColumnVirtualization) {
            let cIndex = info.columnIndexes;
            width = this.getColumnOffset(cIndex[cIndex.length - 1]) - this.getColumnOffset(cIndex[0] - 1) + '';
            this.header.virtualEle.setWrapperWidth(width);
        }
        this.virtualEle.setWrapperWidth(width, this.parent.enableColumnVirtualization || Browser.isIE);
        target.appendChild(newChild);
        this.getTable().appendChild(target);
        if (this.parent.groupSettings.columns.length) {
            if (info.direction === 'up') {
                let blk = this.offsets[this.getTotalBlocks()] - this.prevHeight;
                this.preventEvent = true;
                let sTop = this.content.scrollTop;
                this.content.scrollTop = sTop + blk;
            }
            this.setVirtualHeight();
            this.observer.setPageHeight(this.getOffset(blocks[blocks.length - 1]) - this.getOffset(blocks[0] - 1));
        }
        this.prevInfo = info;
        if (this.isFocused) {
            this.content.focus();
        }
    }
    onDataReady(e) {
        if (!isNullOrUndefined(e.count)) {
            this.count = e.count;
            this.maxPage = Math.ceil(e.count / this.parent.pageSettings.pageSize);
        }
        this.vgenerator.checkAndResetCache(e.requestType);
        this.refreshOffsets();
        this.setVirtualHeight();
        this.resetScrollPosition(e.requestType);
    }
    setVirtualHeight() {
        let width = this.parent.enableColumnVirtualization ?
            this.getColumnOffset(this.parent.columns.length + this.parent.groupSettings.columns.length - 1) + 'px' : '100%';
        this.virtualEle.setVirtualHeight(this.offsets[this.getTotalBlocks()], width);
        if (this.parent.enableColumnVirtualization) {
            this.header.virtualEle.setVirtualHeight(1, width);
        }
    }
    getPageFromTop(sTop, info) {
        let total = this.getTotalBlocks();
        let page = 0;
        let extra = this.offsets[total] - this.prevHeight;
        this.offsetKeys.some((offset) => {
            let iOffset = Number(offset);
            let border = sTop < this.offsets[offset] || (iOffset === total && sTop > this.offsets[offset]);
            if (border) {
                info.block = iOffset % 2 === 0 ? 1 : 0;
                page = Math.max(1, Math.min(this.vgenerator.getPage(iOffset), this.maxPage));
            }
            return border;
        });
        return page;
    }
    getTranslateY(sTop, cHeight, info) {
        if (info === undefined) {
            info = { page: this.getPageFromTop(sTop, {}) };
            info.blockIndexes = this.vgenerator.getBlockIndexes(info.page);
        }
        let block = (info.blockIndexes[0] || 1) - 1;
        let translate = this.getOffset(block);
        let endTranslate = this.getOffset(info.blockIndexes[info.blockIndexes.length - 1]);
        return translate > sTop ? this.getOffset(block - 1) : endTranslate < (sTop + cHeight) ? this.getOffset(block + 1) : translate;
    }
    getOffset(block) {
        return Math.min(this.offsets[block] | 0, this.offsets[this.maxBlock]);
    }
    onEntered() {
        return (element, current, direction, e) => {
            let xAxis = current.axis === 'X';
            let top = this.prevInfo.offsets ? this.prevInfo.offsets.top : null;
            let height = this.content.getBoundingClientRect().height;
            let x = this.getColumnOffset(xAxis ? this.vgenerator.getColumnIndexes()[0] - 1 : this.prevInfo.columnIndexes[0] - 1);
            let y = this.getTranslateY(e.top, height, xAxis && top === e.top ? this.prevInfo : undefined);
            this.virtualEle.adjustTable(x, Math.min(y, this.offsets[this.maxBlock]));
            if (this.parent.enableColumnVirtualization) {
                this.header.virtualEle.adjustTable(x, 0);
            }
        };
    }
    eventListener(action) {
        this.parent[action](dataReady, this.onDataReady, this);
        this.parent[action](refreshVirtualBlock, this.refreshContentRows, this);
        this.actions.forEach((event) => this.parent[action](`${event}-begin`, this.onActionBegin, this));
        let fn = () => {
            this.observer.observe((scrollArgs) => this.scrollListener(scrollArgs), this.onEntered());
            this.parent.off(contentReady, fn);
        };
        this.parent.on(contentReady, fn, this);
    }
    getBlockSize() {
        return this.parent.pageSettings.pageSize >> 1;
    }
    getBlockHeight() {
        return this.getBlockSize() * this.getRowHeight();
    }
    isEndBlock(index) {
        let totalBlocks = this.getTotalBlocks();
        return index >= totalBlocks || index === totalBlocks - 1;
    }
    getRowHeight() {
        return this.parent.rowHeight ? this.parent.rowHeight : getRowHeight();
    }
    getTotalBlocks() {
        return Math.ceil(this.count / this.getBlockSize());
    }
    getColumnOffset(block) {
        return this.vgenerator.cOffsets[block] | 0;
    }
    getModelGenerator() {
        return new VirtualRowModelGenerator(this.parent);
    }
    resetScrollPosition(action) {
        if (this.actions.some((value) => value === action)) {
            this.preventEvent = this.content.scrollTop !== 0;
            this.content.scrollTop = 0;
        }
    }
    onActionBegin(e) {
        //Update property silently..
        this.parent.setProperties({ pageSettings: { currentPage: 1 } }, true);
    }
    getRows() {
        return this.vgenerator.getRows();
    }
    getRowByIndex(index) {
        let prev = this.prevInfo.blockIndexes;
        let startIdx = (prev[0] - 1) * this.getBlockSize();
        return this.parent.getDataRows()[index - startIdx];
    }
    getVirtualRowIndex(index) {
        let prev = this.prevInfo.blockIndexes;
        let startIdx = (prev[0] - 1) * this.getBlockSize();
        return startIdx + index;
    }
    refreshOffsets() {
        let row = 0;
        let bSize = this.getBlockSize();
        let total = this.getTotalBlocks();
        this.prevHeight = this.offsets[total];
        this.maxBlock = total % 2 === 0 ? total - 2 : total - 1;
        this.offsets = {};
        //Row offset update
        Array.apply(null, Array(total)).map(() => ++row)
            .forEach((block) => {
            let tmp = (this.vgenerator.cache[block] || []).length;
            let rem = this.count % bSize;
            let size = block in this.vgenerator.cache ?
                tmp * this.getRowHeight() : rem && block === total ? rem * this.getRowHeight() : this.getBlockHeight();
            // let size: number = this.parent.groupSettings.columns.length && block in this.vgenerator.cache ?
            // tmp * getRowHeight() : this.getBlockHeight();
            this.offsets[block] = (this.offsets[block - 1] | 0) + size;
            this.tmpOffsets[block] = this.offsets[block - 1] | 0;
        });
        this.offsetKeys = Object.keys(this.offsets);
        //Column offset update
        if (this.parent.enableColumnVirtualization) {
            this.vgenerator.refreshColOffsets();
        }
    }
    refreshVirtualElement() {
        this.vgenerator.refreshColOffsets();
        this.setVirtualHeight();
    }
}
/**
 * @hidden
 */
class VirtualHeaderRenderer extends HeaderRender {
    constructor(parent, locator) {
        super(parent, locator);
        this.virtualEle = new VirtualElementHandler();
        this.gen = new VirtualRowModelGenerator(this.parent);
        this.parent.on(refreshVirtualBlock, (e) => e.virtualInfo.sentinelInfo.axis === 'X' ? this.refreshUI() : null, this);
    }
    renderTable() {
        this.gen.refreshColOffsets();
        this.parent.setColumnIndexesInView(this.gen.getColumnIndexes(this.getPanel().firstChild));
        super.renderTable();
        this.virtualEle.table = this.getTable();
        this.virtualEle.content = this.getPanel().firstChild;
        this.virtualEle.content.style.position = 'relative';
        this.virtualEle.renderWrapper();
        this.virtualEle.renderPlaceHolder('absolute');
    }
    appendContent(table) {
        this.virtualEle.wrapper.appendChild(table);
    }
    refreshUI() {
        this.gen.refreshColOffsets();
        this.parent.setColumnIndexesInView(this.gen.getColumnIndexes(this.getPanel().firstChild));
        super.refreshUI();
    }
}
/**
 * @hidden
 */
class VirtualElementHandler {
    renderWrapper() {
        this.wrapper = createElement('div', { className: 'e-virtualtable' });
        this.wrapper.appendChild(this.table);
        this.content.appendChild(this.wrapper);
    }
    renderPlaceHolder(position = 'relative') {
        this.placeholder = createElement('div', { className: 'e-virtualtrack', styles: `position:${position}` });
        this.content.appendChild(this.placeholder);
    }
    adjustTable(xValue, yValue) {
        this.wrapper.style.transform = `translate(${xValue}px, ${yValue}px)`;
    }
    setWrapperWidth(width, full) {
        this.wrapper.style.width = width ? `${width}px` : full ? '100%' : '';
    }
    setVirtualHeight(height, width) {
        this.placeholder.style.height = `${height}px`;
        this.placeholder.style.width = width;
    }
}

/**
 * Virtual Scrolling class
 */
class VirtualScroll {
    constructor(parent, locator) {
        this.parent = parent;
        this.locator = locator;
        this.addEventListener();
    }
    getModuleName() {
        return 'virtualscroll';
    }
    instantiateRenderer() {
        let renderer = this.locator.getService('rendererFactory');
        if (this.parent.enableColumnVirtualization) {
            renderer.addRenderer(RenderType.Header, new VirtualHeaderRenderer(this.parent, this.locator));
        }
        renderer.addRenderer(RenderType.Content, new VirtualContentRenderer(this.parent, this.locator));
        this.ensurePageSize();
    }
    ensurePageSize() {
        let rowHeight = getRowHeight(this.parent.element);
        this.blockSize = ~~(this.parent.height / rowHeight);
        let height = this.blockSize * 2;
        let size = this.parent.pageSettings.pageSize;
        this.parent.setProperties({ pageSettings: { pageSize: size < height ? height : size } }, true);
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialLoad, this.instantiateRenderer, this);
        this.parent.on(columnWidthChanged, this.refreshVirtualElement, this);
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialLoad, this.instantiateRenderer);
        this.parent.off(columnWidthChanged, this.refreshVirtualElement);
    }
    refreshVirtualElement(args) {
        if (this.parent.enableColumnVirtualization && args.module === 'resize') {
            let renderer = this.locator.getService('rendererFactory');
            renderer.getRenderer(RenderType.Content).refreshVirtualElement();
        }
    }
    destroy() {
        this.removeEventListener();
    }
}

/**
 * Edit render module is used to render grid edit row.
 * @hidden
 */
class InlineEditRender {
    /**
     * Constructor for render module
     */
    constructor(parent) {
        this.parent = parent;
    }
    addNew(elements, args) {
        let mTbody;
        let tbody;
        if (this.parent.frozenRows) {
            tbody = this.parent.getHeaderContent().querySelector('tbody');
        }
        else {
            tbody = this.parent.getContentTable().querySelector('tbody');
        }
        args.row = createElement('tr', { className: 'e-row e-addedrow' });
        if (tbody.querySelector('.e-emptyrow')) {
            tbody.querySelector('.e-emptyrow').classList.add('e-hide');
        }
        tbody.insertBefore(args.row, tbody.firstChild);
        args.row.appendChild(this.getEditElement(elements, false));
        if (this.parent.getFrozenColumns()) {
            let mEle = this.renderMovableform(args.row);
            if (this.parent.frozenRows) {
                mTbody = this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody');
            }
            else {
                mTbody = this.parent.getContent().querySelector('.e-movablecontent').querySelector('tbody');
            }
            mTbody.insertBefore(mEle, mTbody.firstChild);
            args.row.querySelector('.e-normaledit').setAttribute('colspan', this.parent.getFrozenColumns() + '');
            mEle.setAttribute('colspan', '' + (this.parent.getColumns().length - this.parent.getFrozenColumns()));
        }
    }
    renderMovableform(ele) {
        let mEle = ele.cloneNode(true);
        this.renderMovable(ele, mEle);
        mEle.querySelector('colgroup').innerHTML = this.parent.getHeaderContent()
            .querySelector('.e-movableheader').querySelector('colgroup').innerHTML;
        return mEle;
    }
    updateFreezeEdit(row, td) {
        if (this.parent.getFrozenColumns()) {
            let idx = parseInt(row.getAttribute('aria-rowindex'), 10);
            let fCont = this.parent.getContent().querySelector('.e-frozencontent').querySelector('tbody');
            let mCont = this.parent.getContent().querySelector('.e-movablecontent').querySelector('tbody');
            let fHdr = this.parent.getHeaderContent().querySelector('.e-frozenheader').querySelector('tbody');
            let mHdr = this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody');
            if (this.parent.frozenRows && idx >= this.parent.frozenRows) {
                idx -= this.parent.frozenRows;
            }
            if (fCont.contains(row)) {
                td = td.concat([].slice.call(mCont.children[idx].querySelectorAll('td.e-rowcell')));
            }
            else if (mCont.contains(row)) {
                td = td.concat([].slice.call(fCont.children[idx].querySelectorAll('td.e-rowcell')));
            }
            else if (fHdr.contains(row)) {
                td = td.concat([].slice.call(mHdr.children[idx].querySelectorAll('td.e-rowcell')));
            }
            else if (mHdr.contains(row)) {
                td = td.concat([].slice.call(fHdr.children[idx].querySelectorAll('td.e-rowcell')));
            }
        }
        return td;
    }
    update(elements, args) {
        let tdElement = [].slice.call(args.row.querySelectorAll('td.e-rowcell'));
        args.row.innerHTML = '';
        tdElement = this.updateFreezeEdit(args.row, tdElement);
        args.row.appendChild(this.getEditElement(elements, true, tdElement));
        args.row.classList.add('e-editedrow');
        this.refreshFreezeEdit(args.row);
    }
    refreshFreezeEdit(row) {
        let td = row.firstChild;
        let fCls;
        let cont;
        let idx = parseInt(row.getAttribute('aria-rowindex'), 10);
        if (this.parent.getFrozenColumns()) {
            if (idx < this.parent.frozenRows) {
                cont = this.parent.getHeaderContent();
                fCls = '.e-frozenheader';
            }
            else {
                cont = this.parent.getContent();
                fCls = '.e-frozencontent';
            }
            let mTd = td.cloneNode(true);
            let fRows;
            if (cont.querySelector(fCls).contains(row)) {
                fRows = this.parent.getMovableRowByIndex(idx);
                this.updateFrozenCont(fRows, td, mTd);
            }
            else {
                fRows = this.parent.getRowByIndex(idx);
                this.updateFrozenCont(fRows, mTd, td);
            }
            fRows.appendChild(mTd);
            fRows.classList.add('e-editedrow');
        }
    }
    updateFrozenCont(row, ele, mEle) {
        row.innerHTML = '';
        this.renderMovable(ele, mEle);
        mEle.querySelector('colgroup').innerHTML = this.parent.getHeaderContent()
            .querySelector('.e-movableheader').querySelector('colgroup').innerHTML;
        ele.setAttribute('colspan', this.parent.getFrozenColumns() + '');
        mEle.setAttribute('colspan', this.parent.getColumns().length - this.parent.getFrozenColumns() + '');
    }
    renderMovable(ele, mEle) {
        let frzCols = this.parent.getFrozenColumns();
        for (let i = 0; i < frzCols; i++) {
            mEle.querySelector('tr').removeChild(mEle.querySelector('tr').children[0]);
        }
        for (let i = frzCols, len = ele.querySelector('tr').childElementCount; i < len; i++) {
            ele.querySelector('tr').removeChild(ele.querySelector('tr').children[ele.querySelector('tr').childElementCount - 1]);
        }
    }
    getEditElement(elements, isEdit, tdElement) {
        let gObj = this.parent;
        let gLen = 0;
        let isDetail = !isNullOrUndefined(gObj.detailTemplate) || !isNullOrUndefined(gObj.childGrid) ? 1 : 0;
        if (gObj.allowGrouping) {
            gLen = gObj.groupSettings.columns.length;
        }
        let td = createElement('td', {
            className: 'e-editcell e-normaledit',
            attrs: { colspan: (gObj.getVisibleColumns().length + gLen + isDetail).toString() }
        });
        let form = createElement('form', { id: gObj.element.id + 'EditForm', className: 'e-gridform' });
        let table = createElement('table', { className: 'e-table e-inline-edit', attrs: { cellspacing: '0.25' } });
        table.appendChild(gObj.getContentTable().querySelector('colgroup').cloneNode(true));
        let tbody = createElement('tbody');
        let tr = createElement('tr');
        let i = 0;
        if (isDetail) {
            tr.insertBefore(createElement('td', { className: 'e-detailrowcollapse' }), tr.firstChild);
        }
        while (i < gLen) {
            tr.appendChild(createElement('td', { className: 'e-indentcell' }));
            i++;
        }
        let m = 0;
        i = 0;
        while ((isEdit && m < tdElement.length && i < gObj.getColumns().length) || i < gObj.getColumns().length) {
            let span = isEdit ? tdElement[m].getAttribute('colspan') : null;
            let col = gObj.getColumns()[i];
            let td = createElement('td', {
                className: 'e-rowcell', attrs: { style: 'text-align:' + (col.textAlign ? col.textAlign : ''), 'colspan': span ? span : '' }
            });
            if (col.visible) {
                td.appendChild(elements[col.uid]);
                if (col.editType === 'booleanedit') {
                    td.classList.add('e-boolcell');
                }
                else if (col.commands || col.commandsTemplate) {
                    addClass([td], 'e-unboundcell');
                }
            }
            else {
                td.classList.add('e-hide');
            }
            tr.appendChild(td);
            i = span ? i + parseInt(span, 10) : i + 1;
            m++;
        }
        tbody.appendChild(tr);
        table.appendChild(tbody);
        form.appendChild(table);
        td.appendChild(form);
        return td;
    }
    removeEventListener() {
        //To destroy the renderer
    }
}

/**
 * Edit render module is used to render grid edit row.
 * @hidden
 */
class BatchEditRender {
    /**
     * Constructor for render module
     */
    constructor(parent) {
        this.parent = parent;
    }
    update(elements, args) {
        args.cell.innerHTML = '';
        args.cell.appendChild(this.getEditElement(elements, args));
        args.cell.classList.add('e-editedbatchcell');
        classList(args.row, ['e-editedrow', 'e-batchrow'], []);
    }
    getEditElement(elements, args) {
        let gObj = this.parent;
        let form = createElement('form', { id: gObj.element.id + 'EditForm', className: 'e-gridform' });
        form.appendChild(elements[args.columnObject.uid]);
        if (args.columnObject.editType === 'booleanedit') {
            args.cell.classList.add('e-boolcell');
        }
        if (!args.columnObject.editType) {
            args.cell.classList.add('e-inputbox');
        }
        return form;
    }
    removeEventListener() {
        //To destroy the renderer
    }
}

/**
 * Edit render module is used to render grid edit row.
 * @hidden
 */
class DialogEditRender {
    /**
     * Constructor for render module
     */
    constructor(parent, serviceLocator) {
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(dialogDestroy, this.destroy, this);
        this.parent.on(destroy, this.destroy, this);
    }
    setLocaleObj() {
        this.l10n = this.serviceLocator.getService('localization');
    }
    addNew(elements, args) {
        this.isEdit = false;
        this.createDialog(elements, args);
    }
    update(elements, args) {
        this.isEdit = true;
        this.createDialog(elements, args);
    }
    createDialog(elements, args) {
        let gObj = this.parent;
        this.dialog = createElement('div', { id: gObj.element.id + '_dialogEdit_wrapper' });
        gObj.element.appendChild(this.dialog);
        this.setLocaleObj();
        let position = this.parent.element.getBoundingClientRect().height < 400 ?
            { X: 'center', Y: 'top' } : { X: 'center', Y: 'center' };
        this.dialogObj = new Dialog({
            header: this.isEdit ? this.l10n.getConstant('EditFormTitle') + '  ' + args.primaryKeyValue[0] :
                this.l10n.getConstant('AddFormTitle'), isModal: true, visible: true, cssClass: 'e-edit-dialog',
            content: this.getEditElement(elements),
            showCloseIcon: true,
            allowDragging: true,
            position: position,
            close: this.dialogClose.bind(this),
            closeOnEscape: true, width: '330px', target: gObj.element, animationSettings: { effect: 'None' },
            buttons: [{
                    click: this.btnClick.bind(this),
                    buttonModel: { content: this.l10n.getConstant('SaveButton'), cssClass: 'e-primary', isPrimary: true }
                },
                { click: this.btnClick.bind(this), buttonModel: { cssClass: 'e-flat', content: this.l10n.getConstant('CancelButton') } }]
        });
        this.dialogObj.appendTo(this.dialog);
        changeButtonType(this.dialogObj.element);
    }
    btnClick(e) {
        if (this.l10n.getConstant('CancelButton').toLowerCase() === e.target.innerText.toLowerCase()) {
            this.dialogClose();
        }
        else {
            this.parent.endEdit();
        }
    }
    dialogClose() {
        this.parent.closeEdit();
        this.destroy();
    }
    destroy(args) {
        this.parent.notify(destroyForm, {});
        this.parent.isEdit = false;
        this.parent.notify(toolbarRefresh, {});
        if (this.dialog && !this.dialogObj.isDestroyed) {
            this.dialogObj.destroy();
            remove(this.dialog);
        }
    }
    getEditElement(elements) {
        let gObj = this.parent;
        let div = createElement('div', { className: this.isEdit ? 'e-editedrow' : 'e-insertedrow' });
        let form = createElement('form', { id: gObj.element.id + 'EditForm', className: 'e-gridform' });
        let table = createElement('table', { className: 'e-table', attrs: { cellspacing: '6px' } });
        let tbody = createElement('tbody');
        let cols = gObj.getColumns();
        for (let i = 0; i < cols.length; i++) {
            if (!cols[i].visible || cols[i].commands || cols[i].commandsTemplate) {
                continue;
            }
            let tr = createElement('tr');
            let dataCell = createElement('td', {
                className: 'e-rowcell', attrs: {
                    style: 'text-align:' + (this.parent.enableRtl ? 'right' : 'left') + ';width:190px'
                }
            });
            let label = createElement('label', { innerHTML: cols[i].field });
            elements[cols[i].uid].classList.remove('e-input');
            dataCell.appendChild(elements[cols[i].uid]);
            tr.appendChild(dataCell);
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        form.appendChild(table);
        div.appendChild(form);
        return div;
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(dialogDestroy, this.destroy);
        this.parent.off(destroy, this.destroy);
    }
}

/**
 * Edit render module is used to render grid edit row.
 * @hidden
 */
class EditRender {
    /**
     * Constructor for render module
     */
    constructor(parent, serviceLocator) {
        //Internal variables               
        this.editType = {
            'Inline': InlineEditRender,
            'Normal': InlineEditRender, 'Batch': BatchEditRender, 'Dialog': DialogEditRender
        };
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.renderer = new this.editType[this.parent.editSettings.mode](parent, serviceLocator);
        this.focus = serviceLocator.getService('focus');
    }
    addNew(args) {
        this.renderer.addNew(this.getEditElements(args), args);
        this.convertWidget(args);
    }
    update(args) {
        this.renderer.update(this.getEditElements(args), args);
        this.convertWidget(args);
    }
    convertWidget(args) {
        let gObj = this.parent;
        let isFocused;
        let cell;
        let value;
        let fForm;
        let frzCols = gObj.getFrozenColumns();
        let form = gObj.element.querySelector('.e-gridform');
        if (frzCols && gObj.editSettings.mode === 'Normal') {
            let rowIndex = parseInt(args.row.getAttribute('aria-rowindex'), 10);
            if (gObj.frozenRows && (args.requestType === 'add' || rowIndex < gObj.frozenRows)) {
                fForm = gObj.element.querySelector('.e-movableheader').querySelector('.e-gridform');
            }
            else {
                fForm = gObj.element.querySelector('.e-movablecontent').querySelector('.e-gridform');
            }
        }
        let cols = gObj.editSettings.mode !== 'Batch' ? gObj.getColumns() : [gObj.getColumnByField(args.columnName)];
        for (let col of cols) {
            if (!col.visible || col.commands) {
                continue;
            }
            value = col.valueAccessor(col.field, args.rowData, col);
            if (frzCols && cols.indexOf(col) >= frzCols && gObj.editSettings.mode === 'Normal') {
                cell = fForm.querySelector('[e-mappinguid=' + col.uid + ']');
            }
            else {
                cell = form.querySelector('[e-mappinguid=' + col.uid + ']');
            }
            let temp = col.edit.write;
            if (!isNullOrUndefined(cell)) {
                col.edit.write({
                    rowData: args.rowData, element: cell, column: col, requestType: args.requestType, row: args.row,
                    foreignKeyData: col.isForeignColumn() && getValue(col.field, args.foreignKeyData)
                });
                if (!isFocused && !cell.getAttribute('disabled')) {
                    this.focusElement(cell, args.type);
                    isFocused = true;
                }
            }
        }
    }
    focusElement(elem, type) {
        let chkBox = this.parent.element.querySelector('.e-edit-checkselect');
        if (!isNullOrUndefined(chkBox)) {
            chkBox.nextElementSibling.classList.add('e-focus');
        }
        if (this.parent.editSettings.mode === 'Batch') {
            this.focus.onClick({ target: closest(elem, 'td') }, true);
        }
        else {
            elem.focus();
        }
        if (elem.classList.contains('e-defaultcell')) {
            elem.setSelectionRange(elem.value.length, elem.value.length);
        }
    }
    getEditElements(args) {
        let gObj = this.parent;
        let elements = {};
        let cols = gObj.editSettings.mode !== 'Batch' ? gObj.getColumns() : [gObj.getColumnByField(args.columnName)];
        for (let i = 0, len = cols.length; i < len; i++) {
            let col = cols[i];
            if (!col.visible) {
                continue;
            }
            if (col.commands || col.commandsTemplate) {
                let cellRendererFact = this.serviceLocator.getService('cellRendererFactory');
                let model = new RowModelGenerator(this.parent);
                let cellRenderer = cellRendererFact.getCellRenderer(CellType.CommandColumn);
                let cells = model.generateRows(args.rowData)[0].cells;
                let td = cellRenderer.render(cells[i], args.rowData, { 'index': args.row ? args.row.getAttribute('aria-rowindex') : 0 });
                let div = td.firstElementChild;
                div.setAttribute('textAlign', td.getAttribute('textAlign'));
                elements[col.uid] = div;
                continue;
            }
            let value = col.valueAccessor(col.field, args.rowData, col);
            let tArgs = { column: col, value: value, type: args.requestType, data: args.rowData };
            let temp = col.edit.create;
            let input;
            input = col.edit.create(tArgs);
            if (typeof input === 'string') {
                let div = createElement('div');
                div.innerHTML = input;
                input = div.firstChild;
            }
            let isInput = input.tagName !== 'input' && input.querySelectorAll('input').length;
            attributes(isInput ? input.querySelector('input') : input, {
                name: col.field, 'e-mappinguid': col.uid,
                id: gObj.element.id + col.field,
            });
            classList(input, ['e-input', 'e-field'], []);
            if (col.textAlign === 'Right') {
                input.classList.add('e-ralign');
            }
            if ((col.isPrimaryKey || col.isIdentity) && args.requestType === 'beginEdit' ||
                (col.isIdentity && args.requestType === 'add')) {
                input.setAttribute('disabled', 'true');
            }
            elements[col.uid] = input;
        }
        return elements;
    }
    destroy() {
        this.renderer.removeEventListener();
    }
}

/**
 * `BooleanEditCell` is used to handle boolean cell type editing.
 * @hidden
 */
class BooleanEditCell {
    constructor(parent) {
        this.activeClasses = ['e-selectionbackground', 'e-active'];
        this.parent = parent;
    }
    create(args) {
        let col = args.column;
        let classNames = 'e-field e-boolcell';
        if (col.type === 'checkbox') {
            classNames = 'e-field e-boolcell e-edit-checkselect';
        }
        return createElement('input', {
            className: classNames, attrs: {
                type: 'checkbox', value: args.value, 'e-mappinguid': col.uid,
                id: this.parent.element.id + col.field, name: col.field
            }
        });
    }
    read(element) {
        return element.checked;
    }
    write(args) {
        let selectChkBox;
        let chkState;
        if (!isNullOrUndefined(args.row)) {
            selectChkBox = args.row.querySelector('.e-edit-checkselect');
        }
        if (args.rowData[args.column.field]) {
            chkState = JSON.parse(args.rowData[args.column.field].toString().toLowerCase());
        }
        if (!isNullOrUndefined(selectChkBox)) {
            this.editType = this.parent.editSettings.mode;
            this.editRow = args.row;
            if (args.requestType !== 'add') {
                let row = this.parent.getRowObjectFromUID(args.row.getAttribute('data-uid'));
                chkState = row ? row.isSelected : false;
            }
            addRemoveActiveClasses([].slice.call(args.row.querySelectorAll('.e-rowcell')), chkState, ...this.activeClasses);
        }
        this.obj = new CheckBox(extend({
            label: this.parent.editSettings.mode !== 'Dialog' ? '' : args.column.headerText,
            checked: chkState,
            disabled: !isEditable(args.column, args.requestType, args.element), enableRtl: this.parent.enableRtl,
            change: this.checkBoxChange.bind(this)
        }, args.column.edit.params));
        this.obj.appendTo(args.element);
    }
    checkBoxChange(args) {
        if (this.editRow && this.editType !== 'Dialog') {
            let add = false;
            if (!args.checked) {
                this.editRow.removeAttribute('aria-selected');
            }
            else {
                add = true;
                this.editRow.setAttribute('aria-selected', add.toString());
            }
            addRemoveActiveClasses([].slice.call(this.editRow.querySelectorAll('.e-rowcell')), add, ...this.activeClasses);
        }
    }
    destroy() {
        if (this.obj) {
            this.obj.destroy();
        }
    }
}

/**
 * `DropDownEditCell` is used to handle dropdown cell type editing.
 * @hidden
 */
class DropDownEditCell {
    constructor(parent) {
        //constructor
        this.parent = parent;
    }
    create(args) {
        //create
        return createElement('input', {
            className: 'e-field', attrs: {
                id: this.parent.element.id + args.column.field, name: args.column.field, type: 'text', 'e-mappinguid': args.column.uid,
            }
        });
    }
    write(args) {
        this.column = args.column;
        let isInline = this.parent.editSettings.mode !== 'Dialog';
        this.obj = new DropDownList(extend({
            dataSource: this.parent.dataSource instanceof DataManager ?
                this.parent.dataSource : new DataManager(this.parent.dataSource),
            query: new Query().select(args.column.field), enabled: isEditable(args.column, args.requestType, args.element),
            fields: { value: args.column.field }, value: args.rowData[args.column.field],
            enableRtl: this.parent.enableRtl, actionComplete: this.ddActionComplete.bind(this),
            placeholder: isInline ? '' : args.column.headerText, popupHeight: '200px',
            floatLabelType: isInline ? 'Never' : 'Always', open: this.dropDownOpen.bind(this),
            sortOrder: 'Ascending'
        }, args.column.edit.params));
        this.obj.appendTo(args.element);
        args.element.setAttribute('name', args.column.field);
    }
    read(element) {
        return element.ej2_instances[0].value;
    }
    ddActionComplete(e) {
        e.result = DataUtil.distinct(e.result, this.column.isForeignColumn() ? this.column.foreignKeyField : this.column.field, true);
        if (this.column.dataSource) {
            this.column.dataSource.dataSource.json = e.result;
        }
    }
    dropDownOpen(args) {
        let dlgElement = parentsUntil(this.obj.element, 'e-dialog');
        if (!isNullOrUndefined(dlgElement)) {
            let dlgObj = this.parent.element.querySelector('#' + dlgElement.id).ej2_instances[0];
            args.popup.element.style.zIndex = (dlgObj.zIndex + 1).toString();
        }
    }
    destroy() {
        if (this.obj) {
            this.obj.destroy();
        }
    }
}

/**
 * `NumericEditCell` is used to handle numeric cell type editing.
 * @hidden
 */
class NumericEditCell {
    constructor(parent) {
        this.parent = parent;
    }
    create(args) {
        return createElement('input', {
            className: 'e-field', attrs: {
                id: this.parent.element.id + args.column.field, name: args.column.field, 'e-mappinguid': args.column.uid
            }
        });
    }
    read(element) {
        element.blur();
        return element.ej2_instances[0].value;
    }
    write(args) {
        let col = args.column;
        let isInline = this.parent.editSettings.mode !== 'Dialog';
        this.obj = new NumericTextBox(extend({
            value: parseFloat(args.rowData[col.field]), enableRtl: this.parent.enableRtl,
            placeholder: isInline ? '' : args.column.headerText,
            enabled: isEditable(args.column, args.requestType, args.element),
            floatLabelType: this.parent.editSettings.mode !== 'Dialog' ? 'Never' : 'Always',
        }, col.edit.params));
        this.obj.appendTo(args.element);
        args.element.setAttribute('name', col.field);
    }
    destroy() {
        if (this.obj && !this.obj.isDestroyed) {
            this.obj.destroy();
        }
    }
}

/**
 * `DefaultEditCell` is used to handle default cell type editing.
 * @hidden
 */
class DefaultEditCell {
    constructor(parent) {
        this.parent = parent;
    }
    create(args) {
        let col = args.column;
        let input = createElement('input', {
            className: 'e-field e-input e-defaultcell', attrs: {
                type: 'text', value: !isNullOrUndefined(args.value) ? args.value : '', 'e-mappinguid': col.uid,
                id: this.parent.element.id + col.field, name: col.field, style: 'text-align:' + col.textAlign,
            }
        });
        return input;
    }
    read(element) {
        return element.value;
    }
    write(args) {
        let col = args.column;
        let isInline = this.parent.editSettings.mode !== 'Dialog';
        Input.createInput({
            element: args.element, floatLabelType: this.parent.editSettings.mode !== 'Dialog' ? 'Never' : 'Always',
            properties: {
                enableRtl: this.parent.enableRtl, enabled: isEditable(args.column, args.requestType, args.element),
                placeholder: isInline ? '' : args.column.headerText
            }
        });
    }
}

/**
 * `NormalEdit` module is used to handle normal('inline, dialog, external') editing actions.
 * @hidden
 */
class NormalEdit {
    constructor(parent, serviceLocator, renderer) {
        this.parent = parent;
        this.renderer = renderer;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    clickHandler(e) {
        let target = e.target;
        let gObj = this.parent;
        if ((((parentsUntil(target, 'e-gridcontent') &&
            parentsUntil(parentsUntil(target, 'e-gridcontent'), 'e-grid').id === gObj.element.id)) || (gObj.frozenRows
            && parentsUntil(target, 'e-headercontent'))) && !parentsUntil(target, 'e-unboundcelldiv')) {
            this.rowIndex = parentsUntil(target, 'e-rowcell') ? parseInt(target.parentElement.getAttribute('aria-rowindex'), 10) : -1;
            if (gObj.isEdit) {
                gObj.editModule.endEdit();
            }
        }
    }
    dblClickHandler(e) {
        if (parentsUntil(e.target, 'e-rowcell') && this.parent.editSettings.allowEditOnDblClick) {
            this.parent.editModule.startEdit(parentsUntil(e.target, 'e-row'));
        }
    }
    /**
     * The function used to trigger editComplete
     * @return {void}
     * @hidden
     */
    editComplete(e) {
        this.parent.isEdit = false;
        switch (e.requestType) {
            case 'save':
                if (!(this.parent.isCheckBoxSelection || this.parent.selectionSettings.type === 'Multiple')
                    || (!this.parent.isPersistSelection)) {
                    this.parent.selectRow(0);
                }
                this.parent.trigger(actionComplete, extend(e, {
                    requestType: 'save',
                    type: actionComplete
                }));
                break;
            case 'delete':
                this.parent.selectRow(this.editRowIndex);
                this.parent.trigger(actionComplete, extend(e, {
                    requestType: 'delete',
                    type: actionComplete
                }));
                break;
        }
    }
    startEdit(tr) {
        let gObj = this.parent;
        let primaryKeys = gObj.getPrimaryKeyFieldNames();
        let primaryKeyValues = [];
        this.rowIndex = this.editRowIndex = parseInt(tr.getAttribute('aria-rowindex'), 10);
        this.previousData = gObj.getCurrentViewRecords()[this.rowIndex];
        for (let i = 0; i < primaryKeys.length; i++) {
            primaryKeyValues.push(this.previousData[primaryKeys[i]]);
        }
        this.uid = tr.getAttribute('data-uid');
        let rowObj = gObj.getRowObjectFromUID(this.uid);
        let args = {
            row: tr, primaryKey: primaryKeys, primaryKeyValue: primaryKeyValues, requestType: 'beginEdit',
            rowData: this.previousData, rowIndex: this.rowIndex, type: 'edit', cancel: false,
            foreignKeyData: rowObj && rowObj.foreignKeyData
        };
        gObj.trigger(beginEdit, args);
        args.type = 'actionBegin';
        gObj.trigger(actionBegin, args);
        if (args.cancel) {
            return;
        }
        gObj.isEdit = true;
        gObj.clearSelection();
        if (gObj.editSettings.mode === 'Dialog') {
            args.row.classList.add('e-dlgeditrow');
        }
        this.renderer.update(args);
        this.uid = tr.getAttribute('data-uid');
        gObj.editModule.applyFormValidation();
        args.type = 'actionComplete';
        gObj.trigger(actionComplete, args);
        if (this.parent.allowTextWrap) {
            this.parent.notify(freezeRender, { case: 'textwrap' });
        }
    }
    updateRow(index, data) {
        let gObj = this.parent;
        let args = {
            requestType: 'save', type: actionBegin, data: data, cancel: false,
            previousData: gObj.getCurrentViewRecords()[index]
        };
        gObj.showSpinner();
        gObj.notify(updateData, args);
        gObj.refresh();
    }
    endEdit() {
        let gObj = this.parent;
        if (!this.parent.isEdit || !gObj.editModule.formObj.validate() ||
            (gObj.editModule.mFormObj && !gObj.editModule.mFormObj.validate())) {
            return;
        }
        let editedData = extend({}, this.previousData);
        let args = {
            requestType: 'save', type: actionBegin, data: editedData, cancel: false,
            previousData: this.previousData, selectedRow: gObj.selectedRowIndex, foreignKeyData: {}
        };
        editedData = gObj.editModule.getCurrentEditedData(gObj.element.querySelector('.e-gridform'), editedData);
        if (gObj.getFrozenColumns() && gObj.editSettings.mode === 'Normal') {
            let mForm = gObj.element.querySelector('.e-movableheader').querySelector('.e-gridform');
            if (gObj.frozenRows && mForm) {
                editedData = gObj.editModule.getCurrentEditedData(mForm, editedData);
            }
            else {
                editedData = gObj.editModule.getCurrentEditedData(gObj.element.querySelector('.e-movablecontent').querySelector('.e-gridform'), editedData);
            }
        }
        if (gObj.element.querySelectorAll('.e-editedrow').length) {
            args.action = 'edit';
            gObj.trigger(actionBegin, args);
            if (args.cancel) {
                return;
            }
            gObj.showSpinner();
            this.destroyElements();
            gObj.notify(updateData, args);
        }
        else {
            args.action = 'add';
            args.selectedRow = 0;
            args.index = this.addedRowIndex;
            gObj.notify(modelChanged, args);
            this.addedRowIndex = null;
            if (args.cancel) {
                return;
            }
            this.destroyElements();
        }
        this.stopEditStatus();
        if (gObj.editSettings.mode === 'Dialog' && args.action !== 'add') {
            gObj.element.querySelector('.e-dlgeditrow').classList.remove('e-dlgeditrow');
        }
    }
    destroyElements() {
        let gObj = this.parent;
        gObj.editModule.destroyWidgets();
        gObj.editModule.destroyForm();
        gObj.notify(dialogDestroy, {});
    }
    editHandler(args) {
        if (args.promise) {
            args.promise.then((e) => this.edSucc(e, args)).catch((e) => this.edFail(e));
        }
        else {
            this.editSuccess(args.data, args);
        }
    }
    edSucc(e, args) {
        this.editSuccess(e, args);
    }
    edFail(e) {
        this.editFailure(e);
    }
    updateCurrentViewData(data) {
        this.parent.getCurrentViewRecords()[this.editRowIndex] = data;
    }
    editSuccess(e, args) {
        if (!isNullOrUndefined(e)) {
            args.data = e;
        }
        this.parent.trigger(beforeDataBound, args);
        args.type = actionComplete;
        this.parent.isEdit = false;
        this.refreshRow(args.data);
        this.updateCurrentViewData(args.data);
        this.parent.trigger(actionComplete, args);
        if (!(this.parent.isCheckBoxSelection || this.parent.selectionSettings.type === 'Multiple')
            || (!this.parent.isPersistSelection)) {
            this.parent.selectRow(this.rowIndex > -1 ? this.rowIndex : this.editRowIndex);
        }
        this.parent.hideSpinner();
    }
    editFailure(e) {
        this.parent.trigger(actionFailure, e);
    }
    refreshRow(data) {
        let frzCols = this.parent.getFrozenColumns();
        let row = new RowRenderer(this.serviceLocator, null, this.parent);
        let rowObj = this.parent.getRowObjectFromUID(this.uid);
        if (rowObj) {
            rowObj.changes = data;
            refreshForeignData(rowObj, this.parent.getForeignKeyColumns(), rowObj.changes);
            row.refresh(rowObj, this.parent.getColumns(), true);
            if (frzCols) {
                let uid;
                if (rowObj.cells.length === frzCols) {
                    uid = this.parent.getMovableRows()[rowObj.index].getAttribute('data-uid');
                }
                else {
                    uid = this.parent.getRows()[rowObj.index].getAttribute('data-uid');
                }
                rowObj = this.parent.getRowObjectFromUID(uid);
                rowObj.changes = data;
                row.refresh(rowObj, this.parent.columns, true);
            }
        }
    }
    closeEdit() {
        if (!this.parent.isEdit) {
            return;
        }
        let gObj = this.parent;
        let args = {
            requestType: 'cancel', type: actionBegin, data: this.previousData, selectedRow: gObj.selectedRowIndex
        };
        gObj.trigger(actionBegin, args);
        if (this.parent.editSettings.mode === 'Dialog') {
            this.parent.notify(dialogDestroy, {});
        }
        gObj.isEdit = false;
        this.stopEditStatus();
        args.type = actionComplete;
        if (gObj.editSettings.mode !== 'Dialog') {
            this.refreshRow(args.data);
        }
        if (gObj.getContentTable().querySelector('tr.e-emptyrow') &&
            !gObj.getContentTable().querySelector('tr.e-row')) {
            gObj.getContentTable().querySelector('tr.e-emptyrow').classList.remove('e-hide');
        }
        gObj.selectRow(this.rowIndex);
        gObj.trigger(actionComplete, args);
    }
    addRecord(data, index) {
        let gObj = this.parent;
        this.addedRowIndex = !isNullOrUndefined(index) ? index : 0;
        if (data) {
            gObj.notify(modelChanged, {
                requestType: 'save', type: actionBegin, data: data, selectedRow: 0, action: 'add', index: index
            });
            return;
        }
        if (gObj.isEdit) {
            return;
        }
        this.previousData = {};
        this.uid = '';
        for (let col of gObj.getColumns()) {
            this.previousData[col.field] = data && data[col.field] ? data[col.field] : col.defaultValue;
        }
        let args = {
            cancel: false, foreignKeyData: {},
            requestType: 'add', data: this.previousData, type: actionBegin, index: index
        };
        gObj.trigger(actionBegin, args);
        if (args.cancel) {
            return;
        }
        gObj.isEdit = true;
        gObj.clearSelection();
        this.renderer.addNew({ rowData: args.data, requestType: 'add' });
        gObj.editModule.applyFormValidation();
        args.type = actionComplete;
        args.row = gObj.element.querySelector('.e-addedrow');
        gObj.trigger(actionComplete, args);
    }
    deleteRecord(fieldname, data) {
        this.editRowIndex = this.parent.selectedRowIndex;
        this.parent.notify(modelChanged, {
            requestType: 'delete', type: actionBegin, foreignKeyData: {},
            data: data ? [data] : this.parent.getSelectedRecords(), tr: this.parent.getSelectedRows(), cancel: false
        });
    }
    stopEditStatus() {
        let gObj = this.parent;
        let elem = gObj.element.querySelector('.e-addedrow');
        let mElem;
        let editMElem;
        if (gObj.getFrozenColumns()) {
            mElem = gObj.element.querySelectorAll('.e-addedrow')[1];
            editMElem = gObj.element.querySelectorAll('.e-editedrow')[1];
            if (mElem) {
                remove(mElem);
            }
            if (editMElem) {
                editMElem.classList.remove('e-editedrow');
            }
        }
        if (elem) {
            remove(elem);
        }
        elem = gObj.element.querySelector('.e-editedrow');
        if (elem) {
            elem.classList.remove('e-editedrow');
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(crudAction, this.editHandler, this);
        this.parent.on(doubleTap, this.dblClickHandler, this);
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(dblclick, this.dblClickHandler, this);
        this.parent.on(deleteComplete, this.editComplete, this);
        this.parent.on(saveComplete, this.editComplete, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(crudAction, this.editHandler);
        this.parent.off(doubleTap, this.dblClickHandler);
        this.parent.off(click, this.clickHandler);
        this.parent.off(dblclick, this.dblClickHandler);
        this.parent.off(deleteComplete, this.editComplete);
        this.parent.off(saveComplete, this.editComplete);
    }
    /**
     * @hidden
     */
    destroy() {
        this.removeEventListener();
        this.renderer.destroy();
    }
}

/**
 * `InlineEdit` module is used to handle inline editing actions.
 * @hidden
 */
class InlineEdit extends NormalEdit {
    constructor(parent, serviceLocator, renderer) {
        super(parent, serviceLocator);
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.renderer = renderer;
    }
    closeEdit() {
        super.closeEdit();
    }
    addRecord(data, index) {
        super.addRecord(data, index);
    }
    endEdit() {
        super.endEdit();
    }
    updateRow(index, data) {
        super.updateRow(index, data);
    }
    deleteRecord(fieldname, data) {
        super.deleteRecord(fieldname, data);
    }
    startEdit(tr) {
        super.startEdit(tr);
    }
}

/**
 * `BatchEdit` module is used to handle batch editing actions.
 * @hidden
 */
class BatchEdit {
    constructor(parent, serviceLocator, renderer) {
        this.cellDetails = {};
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.renderer = renderer;
        this.focus = serviceLocator.getService('focus');
        this.addEventListener();
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(dblclick, this.dblClickHandler, this);
        this.parent.on(beforeCellFocused, this.onBeforeCellFocused, this);
        this.parent.on(cellFocused, this.onCellFocused, this);
        this.dataBoundFunction = this.dataBound.bind(this);
        this.parent.addEventListener(dataBound, this.dataBoundFunction);
        this.parent.on(doubleTap, this.dblClickHandler, this);
        this.parent.on(keyPressed, this.keyDownHandler, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(click, this.clickHandler);
        this.parent.off(dblclick, this.dblClickHandler);
        this.parent.off(beforeCellFocused, this.onBeforeCellFocused);
        this.parent.off(cellFocused, this.onCellFocused);
        this.parent.removeEventListener(dataBound, this.dataBoundFunction);
        this.parent.off(doubleTap, this.dblClickHandler);
        this.parent.off(keyPressed, this.keyDownHandler);
    }
    dataBound() {
        this.parent.notify(toolbarRefresh, {});
    }
    /**
     * @hidden
     */
    destroy() {
        this.removeEventListener();
    }
    clickHandler(e) {
        if (!parentsUntil(e.target, this.parent.element.id + '_add', true)) {
            this.saveCell();
            if (parentsUntil(e.target, 'e-rowcell') && !this.parent.isEdit) {
                this.setCellIdx(e.target);
            }
        }
    }
    dblClickHandler(e) {
        let target = parentsUntil(e.target, 'e-rowcell');
        let tr = parentsUntil(e.target, 'e-row');
        if (target && tr && !isNaN(parseInt(target.getAttribute('aria-colindex'), 10))) {
            this.editCell(parseInt(tr.getAttribute('aria-rowindex'), 10), this.parent.getColumns()[parseInt(target.getAttribute('aria-colindex'), 10)].field);
        }
    }
    onBeforeCellFocused(e) {
        if (this.parent.isEdit && this.validateFormObj() &&
            (e.byClick || (['tab', 'shiftTab', 'enter', 'shiftEnter'].indexOf(e.keyArgs.action) > -1))) {
            e.cancel = true;
            if (e.byClick) {
                e.clickArgs.preventDefault();
            }
            else {
                e.keyArgs.preventDefault();
            }
        }
    }
    onCellFocused(e) {
        let frzCols = this.parent.getFrozenColumns();
        let mCont = this.parent.getContent().querySelector('.e-movablecontent');
        let mHdr = this.parent.getHeaderContent().querySelector('.e-movableheader');
        let clear = (!e.container.isContent || !e.container.isDataCell) && !(this.parent.frozenRows && e.container.isHeader);
        if (!e.byKey || clear) {
            return;
        }
        let [rowIndex, cellIndex] = e.container.indexes;
        if (frzCols && (mCont.contains(e.element) || (this.parent.frozenRows && mHdr.contains(e.element)))) {
            cellIndex += frzCols;
        }
        if (this.parent.frozenRows && e.container.isContent) {
            rowIndex += this.parent.frozenRows;
        }
        let isEdit = this.parent.isEdit;
        if (!document.querySelectorAll('.e-popup-open').length) {
            isEdit = isEdit && !this.validateFormObj();
            switch (e.keyArgs.action) {
                case 'tab':
                case 'shiftTab':
                    if (isEdit) {
                        this.editCellFromIndex(rowIndex, cellIndex);
                    }
                    break;
                case 'enter':
                case 'shiftEnter':
                    e.keyArgs.preventDefault();
                    if (isEdit) {
                        this.editCell(rowIndex, this.cellDetails.column.field);
                    }
                    break;
                case 'f2':
                    this.editCellFromIndex(rowIndex, cellIndex);
                    this.focus.focus();
                    break;
            }
        }
    }
    isAddRow(index) {
        return this.parent.getDataRows()[index].classList.contains('e-insertedrow');
    }
    editCellFromIndex(rowIdx, cellIdx) {
        this.cellDetails.rowIndex = rowIdx;
        this.cellDetails.cellIndex = cellIdx;
        this.editCell(rowIdx, this.parent.getColumns()[cellIdx].field);
    }
    closeEdit() {
        let gObj = this.parent;
        let rows = this.parent.getRowsObject();
        let rowRenderer = new RowRenderer(this.serviceLocator, null, this.parent);
        let tr;
        let mTr;
        if (gObj.isEdit) {
            this.saveCell(true);
        }
        gObj.clearSelection();
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].isDirty) {
                tr = gObj.getContentTable().querySelector('[data-uid=' + rows[i].uid + ']');
                if (gObj.frozenRows) {
                    tr = gObj.getHeaderContent().querySelector('[data-uid=' + rows[i].uid + ']');
                }
                if (gObj.frozenColumns) {
                    if (gObj.frozenRows) {
                        mTr = gObj.getHeaderContent().querySelector('.e-movableheader')
                            .querySelector('[data-uid=' + rows[i].uid + ']');
                    }
                    else {
                        mTr = gObj.getContent().querySelector('.e-movablecontent')
                            .querySelector('[data-uid=' + rows[i].uid + ']');
                    }
                }
                if (tr) {
                    if (tr.classList.contains('e-insertedrow')) {
                        remove(tr);
                        if (gObj.frozenRows && mTr) {
                            remove(mTr);
                        }
                        this.removeRowObjectFromUID(rows[i].uid);
                        i--;
                    }
                    else {
                        delete rows[i].changes;
                        rows[i].isDirty = false;
                        classList(tr, [], ['e-hiddenrow', 'e-updatedtd']);
                        rowRenderer.refresh(rows[i], gObj.getColumns(), false);
                    }
                }
            }
        }
        if (gObj.getContentTable().querySelector('tr.e-emptyrow') &&
            !gObj.getContentTable().querySelector('tr.e-row')) {
            gObj.getContentTable().querySelector('tr.e-emptyrow').classList.remove('e-hide');
        }
        gObj.notify(batchCancel, { rows: this.parent.getRowsObject() });
        gObj.selectRow(this.cellDetails.rowIndex);
        this.refreshRowIdx();
        gObj.notify(toolbarRefresh, {});
        this.parent.notify(tooltipDestroy, {});
    }
    deleteRecord(fieldname, data) {
        this.saveCell();
        if (this.validateFormObj()) {
            this.saveCell(true);
        }
        this.bulkDelete(fieldname, data);
    }
    addRecord(data) {
        this.bulkAddRow(data);
    }
    endEdit(data) {
        if (this.parent.isEdit && this.validateFormObj()) {
            return;
        }
        this.batchSave();
    }
    validateFormObj() {
        return this.parent.editModule.formObj && !this.parent.editModule.formObj.validate();
    }
    batchSave() {
        let gObj = this.parent;
        this.saveCell();
        if (gObj.isEdit) {
            return;
        }
        let changes = this.getBatchChanges();
        let args = { batchChanges: changes, cancel: false };
        gObj.trigger(beforeBatchSave, args);
        if (args.cancel) {
            return;
        }
        gObj.showSpinner();
        gObj.notify(bulkSave, { changes: changes });
    }
    getBatchChanges() {
        let changes = {
            addedRecords: [],
            deletedRecords: [],
            changedRecords: []
        };
        let rows = this.parent.getRowsObject();
        let mRows = this.parent.getMovableRowsObject();
        let frzCols = this.parent.getFrozenColumns();
        for (let row of rows) {
            if (frzCols) {
                this.mergeBatchChanges(row, mRows[row.index], frzCols);
            }
            if (row.isDirty) {
                switch (row.edit) {
                    case 'add':
                        changes.addedRecords.push(row.changes);
                        break;
                    case 'delete':
                        changes.deletedRecords.push(row.data);
                        break;
                    default:
                        changes.changedRecords.push(row.changes);
                }
            }
        }
        return changes;
    }
    mergeBatchChanges(row, mRow, frzCols) {
        if (row.isDirty) {
            if (mRow.isDirty) {
                let i = 0;
                Object.keys(mRow.changes).forEach((key) => {
                    if (i < frzCols) {
                        delete mRow.changes[key];
                    }
                    i++;
                });
                extend(row.changes, mRow.changes);
            }
        }
        else if (mRow.isDirty) {
            extend(row, mRow);
        }
    }
    /**
     * @hidden
     */
    removeRowObjectFromUID(uid) {
        let rows = this.parent.getRowsObject();
        let i = 0;
        for (let len = rows.length; i < len; i++) {
            if (rows[i].uid === uid) {
                break;
            }
        }
        rows.splice(i, 1);
    }
    /**
     * @hidden
     */
    addRowObject(row) {
        this.parent.getRowsObject().unshift(row);
    }
    bulkDelete(fieldname, data) {
        let gObj = this.parent;
        let index = data ? this.getIndexFromData(data) : gObj.selectedRowIndex;
        let selectedRows = gObj.getSelectedRows();
        let args = {
            primaryKey: this.parent.getPrimaryKeyFieldNames(),
            rowIndex: index,
            rowData: data ? data : gObj.getSelectedRecords()[0],
            row: data ? gObj.getRows()[index] : selectedRows[0], cancel: false
        };
        if (!args.row) {
            return;
        }
        gObj.trigger(beforeBatchDelete, args);
        if (args.cancel) {
            return;
        }
        gObj.clearSelection();
        let uid = args.row.getAttribute('data-uid');
        if (args.row.classList.contains('e-insertedrow')) {
            this.removeRowObjectFromUID(uid);
            remove(args.row);
        }
        else {
            let rowObj = gObj.getRowObjectFromUID(uid);
            rowObj.isDirty = true;
            rowObj.edit = 'delete';
            classList(args.row, ['e-hiddenrow', 'e-updatedtd'], []);
            if (gObj.getFrozenColumns()) {
                classList(data ? gObj.getMovableRows()[index] : selectedRows[1], ['e-hiddenrow', 'e-updatedtd'], []);
                if (gObj.frozenRows && index < gObj.frozenRows) {
                    gObj.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody')
                        .appendChild(gObj.getMovableRowByIndex(gObj.frozenRows - 1));
                    gObj.getHeaderContent().querySelector('.e-frozenheader').querySelector('tbody')
                        .appendChild(gObj.getRowByIndex(gObj.frozenRows - 1));
                }
            }
            else if (gObj.frozenRows && index < gObj.frozenRows) {
                gObj.getHeaderContent().querySelector('tbody').appendChild(gObj.getRowByIndex(gObj.frozenRows - 1));
            }
        }
        this.refreshRowIdx();
        gObj.selectRow(index);
        delete args.row;
        gObj.trigger(batchDelete, args);
        gObj.notify(batchDelete, { rows: this.parent.getRowsObject() });
        gObj.notify(toolbarRefresh, {});
    }
    refreshRowIdx() {
        let rows = [];
        let mRows = [];
        let nonMovableRows = [];
        let frzCols = this.parent.getFrozenColumns();
        if (this.parent.frozenRows) {
            rows = [].slice.call(this.parent.getHeaderTable().querySelector('tbody').children);
            if (frzCols) {
                mRows = [].slice.call(this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody').children);
                for (let i = 0; i < mRows.length; i++) {
                    nonMovableRows[i] = createElement('tr', { className: 'emptynonmv' });
                }
            }
        }
        if (frzCols) {
            mRows = mRows.concat([].slice.call(this.parent.getContentTable().querySelector('tbody').children));
            nonMovableRows = nonMovableRows.concat([].slice.call(this.parent.element.querySelector('.e-movablecontent').querySelector('tbody').children));
        }
        rows = rows.concat([].slice.call(this.parent.getContentTable().querySelector('tbody').children));
        for (let i = 0, j = 0, len = rows.length; i < len; i++) {
            if (rows[i].classList.contains('e-row') && !rows[i].classList.contains('e-hiddenrow')) {
                rows[i].setAttribute('aria-rowindex', j.toString());
                if (frzCols) {
                    mRows[i].setAttribute('aria-rowindex', j.toString());
                    if (nonMovableRows[i].classList.contains('e-row')) {
                        nonMovableRows[i].setAttribute('aria-rowindex', j.toString());
                    }
                }
                j++;
            }
            else {
                rows[i].removeAttribute('aria-rowindex');
                if (frzCols) {
                    mRows[i].removeAttribute('aria-rowindex');
                }
            }
        }
    }
    getIndexFromData(data) {
        return inArray(data, this.parent.getCurrentViewRecords());
    }
    bulkAddRow(data) {
        let gObj = this.parent;
        if (!gObj.editSettings.allowAdding) {
            return;
        }
        if (gObj.isEdit) {
            this.saveCell();
        }
        if (gObj.isEdit) {
            return;
        }
        let defaultData = data ? data : this.getDefaultData();
        let args = {
            defaultData: defaultData,
            primaryKey: gObj.getPrimaryKeyFieldNames(),
            cancel: false
        };
        gObj.trigger(beforeBatchAdd, args);
        if (args.cancel) {
            return;
        }
        gObj.clearSelection();
        let mTr;
        let mTbody;
        let row = new RowRenderer(this.serviceLocator, null, this.parent);
        let model = new RowModelGenerator(this.parent);
        let modelData = model.generateRows([args.defaultData]);
        let tr = row.render(modelData[0], gObj.getColumns());
        let col;
        let index;
        for (let i = 0; i < this.parent.groupSettings.columns.length; i++) {
            tr.insertBefore(createElement('td', { className: 'e-indentcell' }), tr.firstChild);
            modelData[0].cells.unshift(new Cell({ cellType: CellType.Indent }));
        }
        let tbody = gObj.getContentTable().querySelector('tbody');
        tr.classList.add('e-insertedrow');
        if (tbody.querySelector('.e-emptyrow')) {
            tbody.querySelector('.e-emptyrow').classList.add('e-hide');
        }
        if (gObj.getFrozenColumns()) {
            mTr = this.renderMovable(tr);
            if (gObj.frozenRows) {
                mTbody = gObj.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody');
            }
            else {
                mTbody = gObj.getContent().querySelector('.e-movablecontent').querySelector('tbody');
            }
            mTbody.insertBefore(mTr, mTbody.firstChild);
            addClass(mTr.querySelectorAll('.e-rowcell'), ['e-updatedtd']);
        }
        if (gObj.frozenRows) {
            tbody = gObj.getHeaderContent().querySelector('tbody');
        }
        tbody.insertBefore(tr, tbody.firstChild);
        addClass(tr.querySelectorAll('.e-rowcell'), ['e-updatedtd']);
        modelData[0].isDirty = true;
        modelData[0].changes = extend({}, modelData[0].data);
        modelData[0].edit = 'add';
        this.addRowObject(modelData[0]);
        this.refreshRowIdx();
        this.focus.forgetPrevious();
        gObj.notify(batchAdd, { rows: this.parent.getRowsObject() });
        gObj.selectRow(0);
        if (!data) {
            index = this.findNextEditableCell(0, true);
            col = gObj.getColumns()[index];
            this.editCell(0, col.field, true);
        }
        let args1 = {
            defaultData: args.defaultData, row: tr,
            columnObject: col, columnIndex: index, primaryKey: args.primaryKey, cell: tr.cells[index]
        };
        gObj.trigger(batchAdd, args1);
    }
    renderMovable(ele) {
        let mEle = ele.cloneNode(true);
        for (let i = 0; i < this.parent.frozenColumns; i++) {
            mEle.removeChild(mEle.children[0]);
        }
        for (let i = this.parent.frozenColumns, len = ele.childElementCount; i < len; i++) {
            ele.removeChild(ele.children[ele.childElementCount - 1]);
        }
        return mEle;
    }
    findNextEditableCell(columnIndex, isAdd) {
        let cols = this.parent.getColumns();
        let endIndex = cols.length;
        for (let i = columnIndex; i < endIndex; i++) {
            if (!isAdd && this.checkNPCell(cols[i])) {
                return i;
            }
            else if (isAdd && !cols[i].template && cols[i].visible && cols[i].allowEditing &&
                !(cols[i].isIdentity && cols[i].isPrimaryKey)) {
                return i;
            }
        }
        return -1;
    }
    checkNPCell(col) {
        return !col.template && col.visible && !col.isPrimaryKey && !col.isIdentity && col.allowEditing;
    }
    getDefaultData() {
        let gObj = this.parent;
        let data = {};
        let dValues = { 'number': 0, 'string': null, 'boolean': false, 'date': null, 'datetime': null };
        for (let col of gObj.getColumns()) {
            data[col.field] = col.defaultValue ? col.defaultValue : dValues[col.type];
        }
        return data;
    }
    setCellIdx(target) {
        let gLen = 0;
        if (this.parent.allowGrouping) {
            gLen = this.parent.groupSettings.columns.length;
        }
        this.cellDetails.cellIndex = target.cellIndex - gLen;
        this.cellDetails.rowIndex = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10);
    }
    editCell(index, field, isAdd) {
        let gObj = this.parent;
        let col = gObj.getColumnByField(field);
        let keys = gObj.getPrimaryKeyFieldNames();
        if (gObj.editSettings.allowEditing && col.allowEditing) {
            if (gObj.isEdit && !(this.cellDetails.column.field === field
                && (this.cellDetails.rowIndex === index && this.parent.getDataRows().length - 1 !== index))) {
                this.saveCell();
                if (this.cellDetails.rowIndex === index && this.cellDetails.column.field === field) {
                    return;
                }
            }
            if (gObj.isEdit) {
                return;
            }
            let row;
            let colIdx = gObj.getColumnIndexByField(field);
            let frzCols = gObj.getFrozenColumns();
            if (frzCols && colIdx >= frzCols) {
                row = gObj.getMovableDataRows()[index];
            }
            else {
                row = gObj.getDataRows()[index];
            }
            if ((keys[0] === col.field && !row.classList.contains('e-insertedrow')) || col.template || col.columns ||
                (col.isPrimaryKey && col.isIdentity)) {
                return;
            }
            let rowObj = gObj.getRowObjectFromUID(row.getAttribute('data-uid'));
            let rowData = extend({}, this.getDataByIndex(index));
            let cells = [].slice.apply(row.cells);
            let args = {
                cell: cells[this.getColIndex(cells, this.getCellIdx(col.uid))], row: row,
                columnName: col.field, columnObject: col, isForeignKey: !isNullOrUndefined(col.foreignKeyValue),
                primaryKey: keys, rowData: rowData,
                validationRules: extend({}, col.validationRules ? col.validationRules : {}),
                value: rowData[col.field], type: !isAdd ? 'edit' : 'add', cancel: false,
                foreignKeyData: rowObj && rowObj.foreignKeyData
            };
            if (!args.cell) {
                return;
            }
            gObj.trigger(cellEdit, args);
            if (args.cancel) {
                return;
            }
            this.cellDetails = {
                rowData: rowData, column: col, value: args.value, isForeignKey: args.isForeignKey, rowIndex: index,
                cellIndex: parseInt(args.cell.getAttribute('aria-colindex'), 10),
                foreignKeyData: args.foreignKeyData
            };
            if (args.cell.classList.contains('e-updatedtd')) {
                this.isColored = true;
                args.cell.classList.remove('e-updatedtd');
            }
            gObj.isEdit = true;
            gObj.clearSelection();
            if (!gObj.isCheckBoxSelection || !gObj.isPersistSelection) {
                gObj.selectRow(this.cellDetails.rowIndex, true);
            }
            this.renderer.update(args);
            this.form = gObj.element.querySelector('#' + gObj.element.id + 'EditForm');
            gObj.editModule.applyFormValidation([col]);
            this.parent.element.querySelector('.e-gridpopup').style.display = 'none';
        }
    }
    updateCell(rowIndex, field, value) {
        let col = this.parent.getColumnByField(field);
        if (col && !col.isPrimaryKey) {
            let td = this.parent.getDataRows()[rowIndex].cells[this.parent.getColumnIndexByField(field)];
            let rowObj = this.parent.getRowObjectFromUID(td.parentElement.getAttribute('data-uid'));
            this.refreshTD(td, col, rowObj, value);
            this.parent.trigger(queryCellInfo, {
                cell: td, column: col, data: rowObj.changes
            });
        }
    }
    setChanges(rowObj, field, value) {
        if (!rowObj.changes) {
            rowObj.changes = extend({}, rowObj.data);
        }
        rowObj.changes[field] = value;
        if (rowObj.data[field] !== value) {
            rowObj.isDirty = true;
        }
    }
    updateRow(index, data) {
        let keys = Object.keys(data);
        for (let col of keys) {
            this.updateCell(index, col, data[col]);
        }
    }
    getCellIdx(uid) {
        let cIdx = this.parent.getColumnIndexByUid(uid) + this.parent.groupSettings.columns.length;
        if (!isNullOrUndefined(this.parent.detailTemplate) || !isNullOrUndefined(this.parent.childGrid)) {
            cIdx++;
        }
        return cIdx;
    }
    refreshTD(td, column, rowObj, value) {
        let cell = new CellRenderer(this.parent, this.serviceLocator);
        this.setChanges(rowObj, column.field, value);
        let frzCols = this.parent.getFrozenColumns();
        refreshForeignData(rowObj, this.parent.getForeignKeyColumns(), rowObj.changes);
        cell.refreshTD(td, rowObj.cells[this.getCellIdx(column.uid) - (this.getCellIdx(column.uid) >= frzCols ? frzCols : 0)], rowObj.changes);
        td.classList.add('e-updatedtd');
        this.parent.notify(toolbarRefresh, {});
    }
    getColIndex(cells, index) {
        let cIdx = 0;
        if (this.parent.allowGrouping && this.parent.groupSettings.columns) {
            cIdx = this.parent.groupSettings.columns.length;
        }
        if (!isNullOrUndefined(this.parent.detailTemplate) || !isNullOrUndefined(this.parent.childGrid)) {
            cIdx++;
        }
        for (let m = 0; m < cells.length; m++) {
            let colIndex = parseInt(cells[m].getAttribute('aria-colindex'), 10);
            if (colIndex === index - cIdx) {
                return m;
            }
        }
        return -1;
    }
    saveCell(isForceSave) {
        let gObj = this.parent;
        if (!isForceSave && (!gObj.isEdit || this.validateFormObj())) {
            return;
        }
        let tr = parentsUntil(this.form, 'e-row');
        let column = this.cellDetails.column;
        let editedData = gObj.editModule.getCurrentEditedData(this.form, {});
        editedData = extend(this.cellDetails.rowData, editedData);
        let args = {
            columnName: column.field,
            value: editedData[column.field],
            rowData: this.cellDetails.rowData,
            previousValue: this.cellDetails.value,
            columnObject: column,
            cell: this.form.parentElement,
            isForeignKey: this.cellDetails.isForeignKey, cancel: false
        };
        if (!isForceSave) {
            gObj.trigger(cellSave, args);
        }
        if (args.cancel) {
            return;
        }
        gObj.editModule.destroyForm();
        gObj.isEdit = false;
        gObj.editModule.destroyWidgets([column]);
        this.parent.notify(tooltipDestroy, {});
        this.refreshTD(args.cell, column, gObj.getRowObjectFromUID(tr.getAttribute('data-uid')), args.value);
        removeClass([tr], ['e-editedrow', 'e-batchrow']);
        removeClass([args.cell], ['e-editedbatchcell', 'e-boolcell']);
        if (!isNullOrUndefined(args.value) && args.value.toString() ===
            (!isNullOrUndefined(this.cellDetails.value) ? this.cellDetails.value : '').toString() && !this.isColored) {
            args.cell.classList.remove('e-updatedtd');
        }
        gObj.notify(toolbarRefresh, {});
        this.isColored = false;
    }
    getDataByIndex(index) {
        let row = this.parent.getRowObjectFromUID(this.parent.getDataRows()[index].getAttribute('data-uid'));
        return row.changes ? row.changes : row.data;
    }
    keyDownHandler(e) {
        if (e.action === 'tab' && this.parent.isEdit) {
            let rowcell = parentsUntil(e.target, 'e-rowcell');
            if (rowcell) {
                let cell = rowcell.querySelector('.e-field');
                if (cell) {
                    let visibleColumns = this.parent.getVisibleColumns();
                    if (visibleColumns[visibleColumns.length - 1].field === cell.getAttribute('name')) {
                        this.saveCell();
                    }
                }
            }
        }
    }
}

/**
 * `DialogEdit` module is used to handle dialog editing actions.
 * @hidden
 */
class DialogEdit extends NormalEdit {
    constructor(parent, serviceLocator, renderer) {
        //constructor
        super(parent, serviceLocator);
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.renderer = renderer;
    }
    closeEdit() {
        //closeEdit
        super.closeEdit();
    }
    addRecord(data, index) {
        //addRecord
        super.addRecord(data, index);
    }
    endEdit() {
        //endEdit
        super.endEdit();
    }
    updateRow(index, data) {
        super.updateRow(index, data);
    }
    deleteRecord(fieldname, data) {
        //deleteRecord
        super.deleteRecord(fieldname, data);
    }
    startEdit(tr) {
        super.startEdit(tr);
    }
}

/**
 * `DatePickerEditCell` is used to handle datepicker cell type editing.
 * @hidden
 */
class DatePickerEditCell {
    constructor(parent) {
        this.parent = parent;
    }
    create(args) {
        return createElement('input', {
            className: 'e-field', attrs: {
                id: this.parent.element.id + args.column.field, name: args.column.field, type: 'text', 'e-mappinguid': args.column.uid
            }
        });
    }
    read(element) {
        return element.ej2_instances[0].value;
    }
    write(args) {
        let isInline = this.parent.editSettings.mode !== 'Dialog';
        this.obj = new DatePicker(extend({
            floatLabelType: isInline ? 'Never' : 'Always',
            value: new Date(args.rowData[args.column.field]), placeholder: isInline ?
                '' : args.column.headerText, enableRtl: this.parent.enableRtl,
            enabled: isEditable(args.column, args.type, args.element),
        }, args.column.edit.params));
        this.obj.appendTo(args.element);
    }
    destroy() {
        if (this.obj) {
            this.obj.destroy();
        }
    }
}

/**
 * The `Edit` module is used to handle editing actions.
 */
class Edit {
    /**
     * Constructor for the Grid editing module
     * @hidden
     */
    constructor(parent, serviceLocator) {
        this.editCellType = {
            'dropdownedit': DropDownEditCell, 'numericedit': NumericEditCell,
            'datepickeredit': DatePickerEditCell, 'booleanedit': BooleanEditCell, 'defaultedit': DefaultEditCell
        };
        this.editType = { 'Inline': InlineEdit, 'Normal': InlineEdit, 'Batch': BatchEdit, 'Dialog': DialogEdit };
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.l10n = this.serviceLocator.getService('localization');
        this.addEventListener();
        this.updateEditObj();
        this.createAlertDlg();
        this.createConfirmDlg();
    }
    updateColTypeObj() {
        for (let col of this.parent.getColumns()) {
            col.edit = extend(new this.editCellType[col.editType && this.editCellType[col.editType] ?
                col.editType : 'defaultedit'](this.parent, this.serviceLocator), col.edit || {});
        }
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    getModuleName() {
        return 'edit';
    }
    /**
     * @hidden
     */
    onPropertyChanged(e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        let gObj = this.parent;
        let newProp = e.properties;
        for (let prop of Object.keys(e.properties)) {
            switch (prop) {
                case 'allowAdding':
                case 'allowDeleting':
                case 'allowEditing':
                    if (gObj.editSettings.allowAdding || gObj.editSettings.allowEditing || gObj.editSettings.allowDeleting) {
                        this.initialEnd();
                    }
                    break;
                case 'mode':
                    this.updateEditObj();
                    gObj.isEdit = false;
                    gObj.refresh();
                    break;
            }
        }
    }
    updateEditObj() {
        if (this.editModule) {
            this.editModule.destroy();
        }
        this.renderer = new EditRender(this.parent, this.serviceLocator);
        this.editModule = new this.editType[this.parent.editSettings.mode](this.parent, this.serviceLocator, this.renderer);
    }
    initialEnd() {
        this.updateColTypeObj();
    }
    wireEvents() {
        EventHandler.add(this.parent.getContent(), 'touchstart', this.tapEvent, this);
    }
    unwireEvents() {
        EventHandler.remove(this.parent.getContent(), 'touchstart', this.tapEvent);
    }
    tapEvent(e) {
        if (this.getUserAgent()) {
            if (!Global.timer) {
                Global.timer = setTimeout(() => {
                    Global.timer = null;
                }, 300);
            }
            else {
                clearTimeout(Global.timer);
                Global.timer = null;
                this.parent.notify(doubleTap, e);
            }
        }
    }
    getUserAgent() {
        let userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipod|ipad/.test(userAgent);
    }
    /**
     * Edits any bound record in the Grid by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row to be edited.
     */
    startEdit(tr) {
        let gObj = this.parent;
        if (!gObj.editSettings.allowEditing || gObj.isEdit || gObj.editSettings.mode === 'Batch') {
            return;
        }
        if (!gObj.getSelectedRows().length) {
            if (!tr) {
                this.showDialog('EditOperationAlert', this.alertDObj);
                return;
            }
        }
        else if (!tr) {
            tr = gObj.getSelectedRows()[0];
        }
        if (tr.style.display === 'none') {
            return;
        }
        this.editModule.startEdit(tr);
        this.refreshToolbar();
        gObj.element.querySelector('.e-gridpopup').style.display = 'none';
        this.parent.notify('start-edit', {});
    }
    /**
     * Cancels edited state.
     */
    closeEdit() {
        if (this.parent.editSettings.mode === 'Batch' && this.parent.editSettings.showConfirmDialog
            && this.parent.element.querySelectorAll('.e-updatedtd').length) {
            this.showDialog('CancelEdit', this.dialogObj);
            return;
        }
        this.editModule.closeEdit();
        this.refreshToolbar();
        this.parent.notify('close-edit', {});
    }
    refreshToolbar() {
        this.parent.notify(toolbarRefresh, {});
    }
    /**
     * To adds a new row at the top with the given data. When data is not passed, it will add empty rows.
     * > `editSettings.allowEditing` should be true.
     * @param {Object} data - Defines the new add record data.
     * @param {number} index - Defines the row index to be added
     */
    addRecord(data, index) {
        if (!this.parent.editSettings.allowAdding) {
            return;
        }
        this.editModule.addRecord(data, index);
        this.refreshToolbar();
        this.parent.notify('start-add', {});
    }
    /**
     * Deletes a record with the given options. If fieldname and data are not given, the Grid will delete the selected record.
     * > `editSettings.allowDeleting` should be true.
     * @param {string} fieldname - Defines the primary key field name of the column.
     * @param {Object} data - Defines the JSON data record to be deleted.
     */
    deleteRecord(fieldname, data) {
        let gObj = this.parent;
        if (!gObj.editSettings.allowDeleting) {
            return;
        }
        if (!data) {
            if (isNullOrUndefined(gObj.selectedRowIndex) || gObj.selectedRowIndex === -1) {
                this.showDialog('DeleteOperationAlert', this.alertDObj);
                return;
            }
        }
        if (gObj.editSettings.showDeleteConfirmDialog) {
            this.showDialog('ConfirmDelete', this.dialogObj);
            return;
        }
        this.editModule.deleteRecord(fieldname, data);
    }
    /**
     * Deletes a visible row by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row element.
     */
    deleteRow(tr) {
        this.deleteRecord(null, this.parent.getCurrentViewRecords()[parseInt(tr.getAttribute('aria-rowindex'), 10)]);
    }
    /**
     * If Grid is in editable state, you can save a record by invoking endEdit.
     */
    endEdit() {
        if (this.parent.editSettings.mode === 'Batch' && this.parent.editSettings.showConfirmDialog &&
            (isNullOrUndefined(this.formObj) || this.formObj.validate())) {
            this.showDialog('BatchSaveConfirm', this.dialogObj);
            return;
        }
        this.endEditing();
    }
    /**
     * To update the specified cell by given value without changing into edited state.
     * @param {number} rowIndex Defines the row index.
     * @param {string} field Defines the column field.
     * @param {string | number | boolean | Date} value - Defines the value to be changed.
     */
    updateCell(rowIndex, field, value) {
        this.editModule.updateCell(rowIndex, field, value);
    }
    /**
     * To update the specified row by given values without changing into edited state.
     * @param {number} index Defines the row index.
     * @param {Object} data Defines the data object to be updated.
     */
    updateRow(index, data) {
        this.editModule.updateRow(index, data);
    }
    /**
     * Resets added, edited, and deleted records in the batch mode.
     */
    batchCancel() {
        this.closeEdit();
    }
    /**
     * Bulk saves added, edited, and deleted records in the batch mode.
     */
    batchSave() {
        this.endEdit();
    }
    /**
     * Changes a particular cell into edited state based on the row index and field name provided in the `batch` mode.
     * @param {number} index - Defines row index to edit a particular cell.
     * @param {string} field - Defines the field name of the column to perform batch edit.
     */
    editCell(index, field) {
        this.editModule.editCell(index, field);
    }
    /**
     * Checks the status of validation at the time of editing. If validation is passed, it returns true.
     * @return {boolean}
     */
    editFormValidate() {
        if (this.formObj) {
            return this.formObj.validate();
        }
        return false;
    }
    /**
     * Gets the added, edited,and deleted data before bulk save to the DataSource in batch mode.
     * @return {Object}
     */
    getBatchChanges() {
        return this.editModule.getBatchChanges ? this.editModule.getBatchChanges() : {};
    }
    /**
     * Gets the current value of the edited component.
     */
    getCurrentEditCellData() {
        let obj = this.getCurrentEditedData(this.formObj.element, {});
        return obj[Object.keys(obj)[0]];
    }
    /**
     * Saves the cell that is currently edited. It does not save the value to the DataSource.
     */
    saveCell() {
        this.editModule.saveCell();
    }
    endEditing() {
        this.editModule.endEdit();
        this.refreshToolbar();
    }
    showDialog(content, obj) {
        obj.content = '<div>' + this.l10n.getConstant(content) + '</div>';
        obj.dataBind();
        obj.show();
    }
    getValueFromType(col, value) {
        let val = value;
        switch (col.type) {
            case 'number':
                val = !isNaN(parseFloat(value)) ? parseFloat(value) : null;
                break;
            case 'boolean':
                if (col.editType !== 'booleanedit') {
                    val = value === this.l10n.getConstant('True') ? true : false;
                }
                break;
            case 'date':
            case 'datetime':
                if (col.editType !== 'datepicker' && value && value.length) {
                    val = new Date(value);
                }
                break;
        }
        return val;
    }
    destroyToolTip() {
        let elements = [].slice.call(this.parent.element.querySelectorAll('.e-griderror'));
        for (let elem of elements) {
            remove(elem);
        }
        this.parent.getContent().firstElementChild.style.position = 'relative';
    }
    createConfirmDlg() {
        this.dialogObj = this.dlgWidget([
            {
                click: this.dlgOk.bind(this),
                buttonModel: { content: this.l10n.getConstant('OKButton'), cssClass: 'e-primary', isPrimary: true }
            },
            {
                click: this.dlgCancel.bind(this),
                buttonModel: { cssClass: 'e-flat', content: this.l10n.getConstant('CancelButton') }
            }
        ], 'EditConfirm');
    }
    createAlertDlg() {
        this.alertDObj = this.dlgWidget([
            {
                click: this.alertClick.bind(this), buttonModel: { content: this.l10n.getConstant('OKButton'), cssClass: 'e-flat', isPrimary: true }
            }
        ], 'EditAlert');
    }
    alertClick() {
        this.alertDObj.hide();
    }
    dlgWidget(btnOptions, name) {
        let div = createElement('div', { id: this.parent.element.id + name });
        this.parent.element.appendChild(div);
        let options = {
            showCloseIcon: false,
            isModal: true,
            visible: false,
            closeOnEscape: true,
            target: this.parent.element,
            width: '320px',
            animationSettings: { effect: 'None' }
        };
        options.buttons = btnOptions;
        let obj = new Dialog(options);
        obj.appendTo(div);
        changeButtonType(obj.element);
        return obj;
    }
    dlgCancel() {
        this.dialogObj.hide();
    }
    dlgOk(e) {
        switch (this.dialogObj.element.querySelector('.e-dlg-content').firstElementChild.innerText) {
            case this.l10n.getConstant('ConfirmDelete'):
                this.editModule.deleteRecord();
                break;
            case this.l10n.getConstant('CancelEdit'):
                this.editModule.closeEdit();
                break;
            case this.l10n.getConstant('BatchSaveConfirm'):
                this.endEditing();
                break;
            case this.l10n.getConstant('BatchSaveLostChanges'):
                this.executeAction();
                break;
        }
        this.dlgCancel();
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(initialEnd, this.initialEnd, this);
        this.parent.on(keyPressed, this.keyPressHandler, this);
        this.parent.on(autoCol, this.updateColTypeObj, this);
        this.parent.on(tooltipDestroy, this.destroyToolTip, this);
        this.parent.on(preventBatch, this.preventBatch, this);
        this.parent.on(destroyForm, this.destroyForm, this);
        this.actionBeginFunction = this.onActionBegin.bind(this);
        this.actionCompleteFunction = this.actionComplete.bind(this);
        this.parent.addEventListener(actionBegin, this.actionBeginFunction);
        this.parent.addEventListener(actionComplete, this.actionCompleteFunction);
        this.parent.on(initialEnd, this.wireEvents, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(initialEnd, this.initialEnd);
        this.parent.off(keyPressed, this.keyPressHandler);
        this.parent.off(autoCol, this.updateColTypeObj);
        this.parent.off(tooltipDestroy, this.destroyToolTip);
        this.parent.off(preventBatch, this.preventBatch);
        this.parent.off(destroyForm, this.destroyForm);
        this.parent.removeEventListener(actionComplete, this.actionCompleteFunction);
        this.parent.removeEventListener(actionBegin, this.actionBeginFunction);
        this.parent.off(initialEnd, this.unwireEvents);
    }
    actionComplete(e) {
        let actions = ['add', 'beginEdit', 'save', 'delete', 'cancel'];
        if (actions.indexOf(e.requestType) < 0) {
            this.parent.isEdit = false;
        }
        this.refreshToolbar();
    }
    /**
     * @hidden
     */
    getCurrentEditedData(form, editedData) {
        let gObj = this.parent;
        let inputs = [].slice.call(form.querySelectorAll('.e-field'));
        for (let i = 0, len = inputs.length; i < len; i++) {
            let col = gObj.getColumnByUid(inputs[i].getAttribute('e-mappinguid'));
            let value;
            if (col && col.field) {
                let temp = col.edit.read;
                if (typeof temp === 'string') {
                    temp = getValue(temp, window);
                }
                if (col.type !== 'checkbox') {
                    value = gObj.editModule.getValueFromType(col, col.edit.read(inputs[i]));
                }
                else {
                    value = inputs[i].checked;
                }
                setValue(col.field, value, editedData);
            }
        }
        return editedData;
    }
    /**
     * @hidden
     */
    onActionBegin(e) {
        let restrictedRequestTypes = ['filterafteropen', 'filterbeforeopen', 'filterchoicerequest', 'save'];
        if (this.parent.editSettings.mode !== 'Batch' && this.formObj && !this.formObj.isDestroyed
            && restrictedRequestTypes.indexOf(e.requestType) === -1) {
            this.destroyForm();
            this.destroyWidgets();
        }
    }
    /**
     * @hidden
     */
    destroyWidgets(cols) {
        cols = cols ? cols : this.parent.getColumns();
        for (let col of cols) {
            if (col.edit.destroy) {
                col.edit.destroy();
            }
        }
    }
    /**
     * @hidden
     */
    destroyForm() {
        this.destroyToolTip();
        if (this.formObj && !this.formObj.isDestroyed) {
            this.formObj.destroy();
        }
        this.destroyToolTip();
    }
    /**
     * To destroy the editing.
     * @return {void}
     * @hidden
     */
    destroy() {
        this.destroyForm();
        this.removeEventListener();
        let elem = this.dialogObj.element;
        this.dialogObj.destroy();
        remove(elem);
        elem = this.alertDObj.element;
        this.alertDObj.destroy();
        remove(elem);
        this.unwireEvents();
    }
    keyPressHandler(e) {
        switch (e.action) {
            case 'insert':
                this.addRecord();
                break;
            case 'delete':
                if (e.target.tagName !== 'INPUT' && !document.querySelector('.e-popup-open')) {
                    this.deleteRecord();
                }
                break;
            case 'f2':
                this.startEdit();
                break;
            case 'enter':
                if (!parentsUntil(e.target, '.e-unboundcelldiv') && this.parent.editSettings.mode !== 'Batch' &&
                    (parentsUntil(e.target, 'e-gridcontent') || (this.parent.frozenRows
                        && parentsUntil(e.target, 'e-headercontent')))
                    && !document.querySelectorAll('.e-popup-open').length) {
                    e.preventDefault();
                    this.endEdit();
                }
                break;
            case 'escape':
                this.closeEdit();
                break;
        }
    }
    preventBatch(args) {
        this.preventObj = args;
        this.showDialog('BatchSaveLostChanges', this.dialogObj);
    }
    executeAction() {
        this.preventObj.handler.call(this.preventObj.instance, this.preventObj.arg1, this.preventObj.arg2, this.preventObj.arg3, this.preventObj.arg4, this.preventObj.arg5, this.preventObj.arg6, this.preventObj.arg7);
    }
    /**
     * @hidden
     */
    applyFormValidation(cols) {
        let gObj = this.parent;
        let frzCols = gObj.getFrozenColumns();
        let form = gObj.element.querySelector('.e-gridform');
        let mForm = gObj.element.querySelectorAll('.e-gridform')[1];
        let rules = {};
        let mRules = {};
        cols = cols ? cols : gObj.columns;
        for (let col of cols) {
            if (col.validationRules && form.querySelectorAll('#' + gObj.element.id + col.field).length) {
                rules[col.field] = col.validationRules;
            }
            else if (frzCols && col.validationRules
                && mForm.querySelectorAll('#' + gObj.element.id + col.field).length) {
                mRules[col.field] = col.validationRules;
            }
        }
        this.parent.editModule.formObj = this.createFormObj(form, rules);
        if (frzCols && this.parent.editSettings.mode !== 'Dialog') {
            this.parent.editModule.mFormObj = this.createFormObj(mForm, mRules);
        }
    }
    createFormObj(form, rules) {
        return new FormValidator(form, {
            rules: rules,
            validationComplete: (args) => {
                this.validationComplete(args);
            },
            customPlacement: (inputElement, error) => {
                this.valErrorPlacement(inputElement, error);
            }
        });
    }
    valErrorPlacement(inputElement, error) {
        if (this.parent.isEdit) {
            let id = error.getAttribute('for');
            let elem = this.getElemTable(inputElement).querySelector('#' + id + '_Error');
            if (!elem) {
                this.createTooltip(inputElement, error, id, '');
            }
            else {
                elem.querySelector('.e-tip-content').innerHTML = error.innerHTML;
            }
        }
    }
    getElemTable(inputElement) {
        let isFHdr;
        if (this.parent.editSettings.mode !== 'Dialog') {
            isFHdr = (this.parent.frozenRows && this.parent.frozenRows
                > (parseInt(closest(inputElement, '.e-row').getAttribute('aria-rowindex'), 10) || 0));
        }
        return this.parent.editSettings.mode !== 'Dialog' ? isFHdr ? this.parent.getHeaderTable() : this.parent.getContentTable() :
            this.parent.element.querySelector('#' + this.parent.element.id + '_dialogEdit_wrapper');
    }
    validationComplete(args) {
        if (this.parent.isEdit) {
            let elem = this.getElemTable(args.element).querySelector('#' + args.inputName + '_Error');
            if (elem) {
                if (args.status === 'failure') {
                    elem.style.display = '';
                }
                else {
                    elem.style.display = 'none';
                }
            }
        }
    }
    createTooltip(element, error, name, display) {
        let gcontent = this.parent.getContent().firstElementChild;
        let isScroll = gcontent.scrollHeight > gcontent.clientHeight;
        let isInline = this.parent.editSettings.mode !== 'Dialog';
        let isFHdr;
        if (isInline) {
            isFHdr = (this.parent.frozenRows && this.parent.frozenRows
                > (parseInt(closest(element, '.e-row').getAttribute('aria-rowindex'), 10) || 0));
        }
        let fCont = this.parent.getContent().querySelector('.e-frozencontent');
        let table = isInline ?
            (isFHdr ? this.parent.getHeaderTable() : this.parent.getContentTable()) :
            this.parent.element.querySelector('#' + this.parent.element.id + '_dialogEdit_wrapper').querySelector('.e-dlg-content');
        let client = table.getBoundingClientRect();
        let left = isInline ?
            this.parent.element.getBoundingClientRect().left : client.left;
        let input = parentsUntil(element, 'e-rowcell');
        let inputClient = input.getBoundingClientRect();
        let td = closest(element, 'td').getBoundingClientRect();
        let div = createElement('div', {
            className: 'e-tooltip-wrap e-control e-popup e-griderror',
            id: name + '_Error',
            styles: 'display:' + display + ';top:' +
                ((isFHdr ? inputClient.top + inputClient.height : inputClient.bottom - client.top
                    - (this.parent.getFrozenColumns() ? fCont.scrollTop : 0)) + table.scrollTop + 9) + 'px;left:' +
                (inputClient.left - left + table.scrollLeft + inputClient.width / 2) + 'px;' +
                'max-width:' + td.width + 'px;text-align:center;'
        });
        let content = createElement('div', { className: 'e-tip-content' });
        content.appendChild(error);
        let arrow = createElement('div', { className: 'e-arrow-tip e-tip-top' });
        arrow.appendChild(createElement('div', { className: 'e-arrow-tip-outer e-tip-top' }));
        arrow.appendChild(createElement('div', { className: 'e-arrow-tip-inner e-tip-top' }));
        div.appendChild(content);
        div.appendChild(arrow);
        table.appendChild(div);
        let lineHeight = parseInt(document.defaultView.getComputedStyle(div, null).getPropertyValue('font-size'), 10);
        if (div.getBoundingClientRect().width < td.width &&
            div.querySelector('label').getBoundingClientRect().height / (lineHeight * 1.2) >= 2) {
            div.style.width = div.style.maxWidth;
        }
        div.style.left = (parseInt(div.style.left, 10) - div.offsetWidth / 2) + 'px';
        if (!isScroll && isInline && !this.parent.allowPaging) {
            gcontent.style.position = 'static';
            let pos = calculateRelativeBasedPosition(input, div);
            div.style.top = pos.top + inputClient.height + 9 + 'px';
        }
    }
}
/** @hidden */
var Global;
(function (Global) {
    Global.timer = null;
})(Global || (Global = {}));

/**
 * The `ColumnChooser` module is used to show or hide columns dynamically.
 */
class ColumnChooser {
    /**
     * Constructor for the Grid ColumnChooser module
     * @hidden
     */
    constructor(parent, serviceLocator) {
        this.showColumn = [];
        this.hideColumn = [];
        this.isDlgOpen = false;
        this.dlghide = false;
        this.initialOpenDlg = true;
        this.stateChangeColumns = [];
        this.isInitialOpen = false;
        this.isCustomizeOpenCC = false;
        this.cBoxTrue = createCheckBox(true, { checked: true, label: ' ' });
        this.cBoxFalse = createCheckBox(true, { checked: false, label: ' ' });
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
        this.cBoxTrue.insertBefore(createElement('input', {
            className: 'e-chk-hidden e-cc e-cc-chbox', attrs: { type: 'checkbox' }
        }), this.cBoxTrue.firstChild);
        this.cBoxFalse.insertBefore(createElement('input', {
            className: 'e-chk-hidden e-cc e-cc-chbox', attrs: { 'type': 'checkbox' }
        }), this.cBoxFalse.firstChild);
        this.cBoxFalse.querySelector('.e-frame').classList.add('e-uncheck');
        if (this.parent.enableRtl) {
            addClass([this.cBoxTrue, this.cBoxFalse], ['e-rtl']);
        }
    }
    destroy() {
        this.removeEventListener();
        this.unWireEvents();
        if (!isNullOrUndefined(this.dlgObj) && this.dlgObj.element && !this.dlgObj.isDestroyed) {
            this.dlgObj.destroy();
        }
    }
    rtlUpdate() {
        if (this.parent.enableRtl) {
            addClass(this.innerDiv.querySelectorAll('.e-checkbox-wrapper'), ['e-rtl']);
        }
        else {
            removeClass(this.innerDiv.querySelectorAll('.e-checkbox-wrapper'), ['e-rtl']);
        }
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(click, this.clickHandler, this);
        this.parent.on(uiUpdate, this.enableAfterRenderEle, this);
        this.parent.on(initialEnd, this.render, this);
        this.parent.addEventListener(dataBound, this.hideDialog.bind(this));
        this.parent.on(destroy, this.destroy, this);
        this.parent.on(rtlUpdated, this.rtlUpdate, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(click, this.clickHandler);
        this.parent.off(initialEnd, this.render);
        this.parent.off(destroy, this.destroy);
        this.parent.off(uiUpdate, this.enableAfterRenderEle);
        this.parent.off(rtlUpdated, this.rtlUpdate);
    }
    render() {
        this.l10n = this.serviceLocator.getService('localization');
        this.renderDlgContent();
        this.getShowHideService = this.serviceLocator.getService('showHideService');
    }
    clickHandler(e) {
        let targetElement = e.target;
        if (!this.isCustomizeOpenCC) {
            if (!isNullOrUndefined(closest(targetElement, '.e-cc')) || !isNullOrUndefined(closest(targetElement, '.e-cc-toolbar'))) {
                if (targetElement.classList.contains('e-columnchooser-btn') || targetElement.classList.contains('e-cc-toolbar')) {
                    if ((this.initialOpenDlg && this.dlgObj.visible) || !this.isDlgOpen) {
                        this.isDlgOpen = true;
                        return;
                    }
                }
                else if (targetElement.classList.contains('e-cc-cancel')) {
                    targetElement.parentElement.querySelector('.e-ccsearch').value = '';
                    this.columnChooserSearch('');
                    this.removeCancelIcon();
                }
            }
            else {
                if (!isNullOrUndefined(this.dlgObj) && this.dlgObj.visible && !targetElement.classList.contains('e-toolbar-items')) {
                    this.dlgObj.hide();
                    this.refreshCheckboxState();
                    // this.unWireEvents();
                    this.isDlgOpen = false;
                }
            }
        }
    }
    hideDialog() {
        if (!isNullOrUndefined(this.dlgObj) && this.dlgObj.visible) {
            this.dlgObj.hide();
            // this.unWireEvents();
            this.isDlgOpen = false;
        }
    }
    /**
     * To render columnChooser when showColumnChooser enabled.
     * @return {void}
     * @hidden
     */
    renderColumnChooser(x, y, target) {
        if (!this.dlgObj.visible) {
            let args1 = {
                requestType: 'beforeOpenColumnChooser', element: this.parent.element,
                columns: this.getColumns(), cancel: false
            };
            this.parent.trigger(beforeOpenColumnChooser, args1);
            if (args1.cancel) {
                return;
            }
            this.refreshCheckboxState();
            this.dlgObj.dataBind();
            this.dlgObj.element.style.maxHeight = '430px';
            let elementVisible = this.dlgObj.element.style.display;
            this.dlgObj.element.style.display = 'block';
            let newpos = calculateRelativeBasedPosition(closest(target, '.e-toolbar-item'), this.dlgObj.element);
            this.dlgObj.element.style.display = elementVisible;
            this.dlgObj.element.style.top = newpos.top + closest(target, '.e-cc-toolbar').getBoundingClientRect().height + 'px';
            let dlgWidth = 250;
            if (!isNullOrUndefined(closest(target, '.e-bigger'))) {
                this.dlgObj.width = 258;
            }
            if (Browser.isDevice) {
                this.dlgObj.target = document.body;
                this.dlgObj.position = { X: 'center', Y: 'center' };
                this.dlgObj.refreshPosition();
                this.dlgObj.open = this.mOpenDlg.bind(this);
            }
            else {
                if (this.parent.enableRtl) {
                    this.dlgObj.element.style.left = target.offsetLeft + 'px';
                }
                else {
                    this.dlgObj.element.style.left = ((newpos.left - dlgWidth) + closest(target, '.e-cc-toolbar').clientWidth) + 2 + 'px';
                }
            }
            this.removeCancelIcon();
            this.dlgObj.show();
        }
        else {
            // this.unWireEvents();
            this.hideDialog();
            this.addcancelIcon();
        }
    }
    /**
     * Column chooser can be displayed on screen by given position(X and Y axis).
     * @param  {number} X - Defines the X axis.
     * @param  {number} Y - Defines the Y axis.
     * @return {void}
     */
    openColumnChooser(X, Y) {
        this.isCustomizeOpenCC = true;
        if (this.dlgObj.visible) {
            this.hideDialog();
            return;
        }
        if (!this.isInitialOpen) {
            this.dlgObj.content = this.renderChooserList();
        }
        else {
            this.refreshCheckboxState();
        }
        this.dlgObj.dataBind();
        this.dlgObj.position = { X: 'center', Y: 'center' };
        if (isNullOrUndefined(X)) {
            this.dlgObj.position = { X: 'center', Y: 'center' };
            this.dlgObj.refreshPosition();
        }
        else {
            this.dlgObj.element.style.top = '';
            this.dlgObj.element.style.left = '';
            this.dlgObj.element.style.top = Y + 'px';
            this.dlgObj.element.style.left = X + 'px';
        }
        this.dlgObj.beforeOpen = this.customDialogOpen.bind(this);
        this.dlgObj.show();
        this.isInitialOpen = true;
        this.dlgObj.beforeClose = this.customDialogClose.bind(this);
    }
    enableAfterRenderEle(e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.render();
        }
    }
    customDialogOpen() {
        let searchElement = this.dlgObj.content.querySelector('input.e-ccsearch');
        EventHandler.add(searchElement, 'keyup', this.columnChooserManualSearch, this);
    }
    customDialogClose() {
        let searchElement = this.dlgObj.content.querySelector('input.e-ccsearch');
        EventHandler.remove(searchElement, 'keyup', this.columnChooserManualSearch);
    }
    getColumns() {
        let columns = this.parent.getColumns().filter((column) => column.type !== 'checkbox'
            || column.type === 'checkbox' && column.field !== undefined);
        return columns;
    }
    renderDlgContent() {
        let y;
        this.dlgDiv = createElement('div', { className: 'e-ccdlg e-cc', id: this.parent.element.id + '_ccdlg' });
        this.parent.element.appendChild(this.dlgDiv);
        let xpos = this.parent.element.getBoundingClientRect().width - 250;
        let dialoPos = this.parent.enableRtl ? 'left' : 'right';
        let tarElement = this.parent.element.querySelector('.e-ccdiv');
        if (!isNullOrUndefined(tarElement)) {
            y = tarElement.getBoundingClientRect().top;
        }
        this.dlgObj = new Dialog({
            header: this.l10n.getConstant('ChooseColumns'),
            showCloseIcon: false,
            closeOnEscape: false,
            locale: this.parent.locale,
            visible: false,
            enableRtl: this.parent.enableRtl,
            target: document.getElementById(this.parent.element.id),
            buttons: [{
                    click: this.confirmDlgBtnClick.bind(this),
                    buttonModel: {
                        content: this.l10n.getConstant('OKButton'), isPrimary: true,
                        cssClass: 'e-cc e-cc_okbtn',
                    }
                },
                {
                    click: this.clearActions.bind(this),
                    buttonModel: { cssClass: 'e-flat e-cc e-cc-cnbtn', content: this.l10n.getConstant('CancelButton') }
                }],
            content: this.renderChooserList(),
            width: 250,
            cssClass: 'e-cc',
            animationSettings: { effect: 'None' },
        });
        this.dlgObj.appendTo(this.dlgDiv);
        changeButtonType(this.dlgObj.element);
        this.wireEvents();
    }
    renderChooserList() {
        this.mainDiv = createElement('div', { className: 'e-main-div e-cc' });
        let searchDiv = createElement('div', { className: 'e-cc-searchdiv e-cc e-input-group' });
        let ccsearchele = createElement('input', {
            className: 'e-ccsearch e-cc e-input',
            attrs: { placeholder: this.l10n.getConstant('Search') }
        });
        let ccsearchicon = createElement('span', { className: 'e-ccsearch-icon e-icons e-cc e-input-group-icon' });
        let conDiv = createElement('div', { className: 'e-cc-contentdiv' });
        this.innerDiv = createElement('div', { className: 'e-innerdiv e-cc' });
        searchDiv.appendChild(ccsearchele);
        searchDiv.appendChild(ccsearchicon);
        this.searchBoxObj = new SearchBox(ccsearchele);
        let innerDivContent = this.refreshCheckboxList(this.parent.getColumns());
        this.innerDiv.appendChild(innerDivContent);
        conDiv.appendChild(this.innerDiv);
        this.mainDiv.appendChild(searchDiv);
        this.mainDiv.appendChild(conDiv);
        return this.mainDiv;
    }
    confirmDlgBtnClick(args) {
        this.stateChangeColumns = [];
        if (!isNullOrUndefined(args)) {
            if (this.hideColumn.length) {
                this.columnStateChange(this.hideColumn, false);
            }
            if (this.showColumn.length) {
                this.columnStateChange(this.showColumn, true);
            }
            let params = {
                requestType: 'columnstate', element: this.parent.element,
                columns: this.stateChangeColumns, dialogInstance: this.dlgObj
            };
            this.parent.trigger(actionComplete, params);
            this.getShowHideService.setVisible(this.stateChangeColumns);
            this.clearActions();
            this.parent.notify(tooltipDestroy, { module: 'edit' });
        }
    }
    columnStateChange(stateColumns, state) {
        for (let index = 0; index < stateColumns.length; index++) {
            let colUid = stateColumns[index];
            let currentCol = this.parent.getColumnByUid(colUid);
            currentCol.visible = state;
            this.stateChangeColumns.push(currentCol);
        }
    }
    clearActions() {
        this.hideColumn = [];
        this.showColumn = [];
        // this.unWireEvents();
        this.hideDialog();
        this.addcancelIcon();
    }
    checkstatecolumn(isChecked, coluid) {
        if (isChecked) {
            if (this.hideColumn.indexOf(coluid) !== -1) {
                this.hideColumn.splice(this.hideColumn.indexOf(coluid), 1);
            }
            if (this.showColumn.indexOf(coluid) === -1) {
                this.showColumn.push(coluid);
            }
        }
        else {
            if (this.showColumn.indexOf(coluid) !== -1) {
                this.showColumn.splice(this.showColumn.indexOf(coluid), 1);
            }
            if (this.hideColumn.indexOf(coluid) === -1) {
                this.hideColumn.push(coluid);
            }
        }
    }
    columnChooserSearch(searchVal) {
        let clearSearch = false;
        let fltrCol;
        if (searchVal === '') {
            this.removeCancelIcon();
            fltrCol = this.getColumns();
            clearSearch = true;
        }
        else {
            fltrCol = new DataManager(this.getColumns()).executeLocal(new Query()
                .where('headerText', 'startswith', searchVal, true));
        }
        if (fltrCol.length) {
            this.innerDiv.innerHTML = ' ';
            this.innerDiv.classList.remove('e-ccnmdiv');
            this.innerDiv.appendChild(this.refreshCheckboxList(fltrCol, searchVal));
            if (!clearSearch) {
                this.addcancelIcon();
            }
        }
        else {
            let nMatchele = createElement('span', { className: 'e-cc e-nmatch' });
            nMatchele.innerHTML = this.l10n.getConstant('Matchs');
            this.innerDiv.innerHTML = ' ';
            this.innerDiv.appendChild(nMatchele);
            this.innerDiv.classList.add('e-ccnmdiv');
        }
        this.flag = true;
        this.stopTimer();
    }
    wireEvents() {
        EventHandler.add(this.dlgObj.element, 'click', this.checkBoxClickHandler, this);
        EventHandler.add(this.searchBoxObj.searchBox, 'keyup', this.columnChooserManualSearch, this);
        this.searchBoxObj.wireEvent();
    }
    unWireEvents() {
        if (this.parent.isDestroyed) {
            return;
        }
        if (this.dlgObj.element) {
            EventHandler.remove(this.dlgObj.element, 'click', this.checkBoxClickHandler);
        }
        EventHandler.remove(this.searchBoxObj.searchBox, 'keyup', this.columnChooserManualSearch);
        this.searchBoxObj.unWireEvent();
    }
    checkBoxClickHandler(e) {
        let checkstate;
        let elem = parentsUntil(e.target, 'e-checkbox-wrapper');
        if (elem) {
            toogleCheckbox(elem.parentElement);
            elem.querySelector('.e-chk-hidden').focus();
            if (elem.querySelector('.e-check')) {
                checkstate = true;
            }
            else if (elem.querySelector('.e-uncheck')) {
                checkstate = false;
            }
            else {
                return;
            }
            let columnUid = parentsUntil(elem, 'e-ccheck').getAttribute('uid');
            this.checkstatecolumn(checkstate, columnUid);
        }
    }
    refreshCheckboxList(gdCol, searchVal) {
        this.ulElement = createElement('ul', { className: 'e-ccul-ele e-cc' });
        for (let i = 0; i < gdCol.length; i++) {
            let columns = gdCol[i];
            this.renderCheckbox(columns);
        }
        return this.ulElement;
    }
    refreshCheckboxState() {
        this.dlgObj.element.querySelector('.e-cc.e-input').value = '';
        this.columnChooserSearch('');
        for (let i = 0; i < this.parent.element.querySelectorAll('.e-cc-chbox').length; i++) {
            let element = this.parent.element.querySelectorAll('.e-cc-chbox')[i];
            let columnUID = parentsUntil(element, 'e-ccheck').getAttribute('uid');
            let column = this.parent.getColumnByUid(columnUID);
            if (column.visible) {
                element.checked = true;
                this.checkState(element.parentElement.querySelector('.e-icons'), true);
            }
            else {
                element.checked = false;
                this.checkState(element.parentElement.querySelector('.e-icons'), false);
            }
        }
    }
    checkState(element, state) {
        state ? classList(element, ['e-check'], ['e-uncheck']) : classList(element, ['e-uncheck'], ['e-check']);
    }
    createCheckBox(label, checked, uid) {
        let cbox = checked ? this.cBoxTrue.cloneNode(true) : this.cBoxFalse.cloneNode(true);
        cbox.querySelector('.e-label').innerHTML = label;
        return createCboxWithWrap(uid, cbox, 'e-ccheck');
    }
    renderCheckbox(column) {
        let cclist;
        let hideColState;
        let showColState;
        if (column.showInColumnChooser) {
            cclist = createElement('li', { className: 'e-cclist e-cc', styles: 'list-style:None', id: 'e-ccli_' + column.uid });
            hideColState = this.hideColumn.indexOf(column.uid) === -1 ? false : true;
            showColState = this.showColumn.indexOf(column.uid) === -1 ? false : true;
            let cccheckboxlist = this.createCheckBox(column.headerText, (column.visible && !hideColState) || showColState, column.uid);
            cclist.appendChild(cccheckboxlist);
            this.ulElement.appendChild(cclist);
        }
    }
    columnChooserManualSearch(e) {
        this.addcancelIcon();
        this.searchValue = e.target.value;
        this.stopTimer();
        this.startTimer(e);
    }
    startTimer(e) {
        let proxy = this;
        let interval = !proxy.flag && e.keyCode !== 13 ? 500 : 0;
        this.timer = window.setInterval(() => { proxy.columnChooserSearch(proxy.searchValue); }, interval);
    }
    stopTimer() {
        window.clearInterval(this.timer);
    }
    addcancelIcon() {
        this.dlgDiv.querySelector('.e-cc.e-ccsearch-icon').classList.add('e-cc-cancel');
    }
    removeCancelIcon() {
        this.dlgDiv.querySelector('.e-cc.e-ccsearch-icon').classList.remove('e-cc-cancel');
    }
    mOpenDlg() {
        if (Browser.isDevice) {
            this.dlgObj.element.querySelector('.e-cc-searchdiv').classList.remove('e-input-focus');
            this.dlgObj.element.querySelectorAll('.e-cc-chbox')[0].focus();
        }
    }
    // internally use
    getModuleName() {
        return 'columnChooser';
    }
}

/**
 * @hidden
 * `ExportHelper` for `PdfExport` & `ExcelExport`
 */
class ExportHelper {
    constructor(parent) {
        this.hideColumnInclude = false;
        this.foreignKeyData = {};
        this.parent = parent;
    }
    static getQuery(parent, data) {
        return data.isRemote() ?
            data.generateQuery(true).requiresCount().take(parent.pageSettings.totalRecordsCount) :
            data.generateQuery(true).requiresCount();
    }
    getFData(value, column) {
        let foreignKeyData = getForeignData(column, {}, value, this.foreignKeyData[column.field])[0];
        return foreignKeyData;
    }
    getColumnData(gridObj) {
        let columnPromise = [];
        let promise;
        let fColumns = gridObj.getForeignKeyColumns();
        if (fColumns.length) {
            fColumns.forEach((col) => {
                columnPromise.push(col.dataSource.executeQuery(new Query()));
            });
            promise = Promise.all(columnPromise).then((e) => {
                fColumns.forEach((col, index) => {
                    this.foreignKeyData[col.field] = e[index].result;
                });
                // tslint:disable-next-line:no-any
            });
        }
        return promise;
    }
    /* tslint:disable:no-any */
    getHeaders(column, isHideColumnInclude) {
        if (isHideColumnInclude) {
            this.hideColumnInclude = true;
        }
        else {
            this.hideColumnInclude = false;
        }
        let cols = column;
        this.colDepth = this.measureColumnDepth(cols);
        let rows = [];
        let actualColumns = [];
        for (let i = 0; i < this.colDepth; i++) {
            rows[i] = new Row({});
            rows[i].cells = [];
        }
        rows = this.processColumns(rows);
        rows = this.processHeaderCells(rows);
        for (let row of rows) {
            for (let i = 0; i < row.cells.length; i++) {
                let cell = row.cells[i];
                if (cell.visible === undefined && cell.cellType !== CellType.StackedHeader) {
                    row.cells = this.removeCellFromRow(row.cells, i);
                    i = i - 1;
                }
                if ((!isHideColumnInclude) && cell.visible !== undefined && (!cell.visible)) {
                    row.cells = this.removeCellFromRow(row.cells, i);
                    i = i - 1;
                }
            }
        }
        for (let i = 0; i < cols.length; i++) {
            this.generateActualColumns(cols[i], actualColumns);
        }
        return { rows: rows, columns: actualColumns };
    }
    getConvertedWidth(input) {
        let value = parseFloat(input);
        /* tslint:disable-next-line:max-line-length */
        return (input.indexOf('%') !== -1) ? (this.parent.element.getBoundingClientRect().width * value / 100) : value;
    }
    generateActualColumns(column, actualColumns) {
        if (!column.columns) {
            if (column.visible || this.hideColumnInclude) {
                actualColumns.push(column);
            }
        }
        else {
            if (column.visible || this.hideColumnInclude) {
                let colSpan = this.getCellCount(column, 0);
                if (colSpan !== 0) {
                    for (let i = 0; i < column.columns.length; i++) {
                        /* tslint:disable-next-line:max-line-length */
                        this.generateActualColumns(column.columns[i], actualColumns);
                    }
                }
            }
        }
    }
    removeCellFromRow(cells, cellIndex) {
        let resultCells = [];
        for (let i = 0; i < cellIndex; i++) {
            resultCells.push(cells[i]);
        }
        for (let i = (cellIndex + 1); i < cells.length; i++) {
            resultCells.push(cells[i]);
        }
        return resultCells;
    }
    processHeaderCells(rows) {
        let columns = this.parent.enableColumnVirtualization ? this.parent.getColumns() : this.parent.columns;
        for (let i = 0; i < columns.length; i++) {
            rows = this.appendGridCells(columns[i], rows, 0, i === 0, false, i === (columns.length - 1));
        }
        return rows;
    }
    /* tslint:disable */
    appendGridCells(cols, gridRows, index, isFirstObj, isFirstColumn, isLastColumn) {
        /* tslint:enable */
        let lastCol = isLastColumn ? 'e-lastcell' : '';
        if (!cols.columns) {
            gridRows[index].cells.push(this.generateCell(cols, CellType.Header, this.colDepth - index, (isFirstObj ? '' : (isFirstColumn ? 'e-firstcell' : '')) + lastCol, index, this.parent.getColumnIndexByUid(cols.uid)));
        }
        else {
            let colSpan = this.getCellCount(cols, 0);
            if (colSpan) {
                gridRows[index].cells.push(new Cell({
                    cellType: CellType.StackedHeader, column: cols, colSpan: colSpan
                }));
            }
            let isIgnoreFirstCell;
            for (let i = 0, len = cols.columns.length; i < len; i++) {
                if (cols.columns[i].visible && !isIgnoreFirstCell) {
                    isIgnoreFirstCell = true;
                }
                /* tslint:disable-next-line:max-line-length */
                gridRows = this.appendGridCells(cols.columns[i], gridRows, index + 1, isFirstObj, i === 0, i === (len - 1) && isLastColumn);
            }
        }
        return gridRows;
    }
    generateCell(gridColumn, cellType, rowSpan, className, rowIndex, columnIndex) {
        let option = {
            'visible': gridColumn.visible,
            'isDataCell': false,
            'isTemplate': !isNullOrUndefined(gridColumn.headerTemplate),
            'rowID': '',
            'column': gridColumn,
            'cellType': cellType,
            'rowSpan': rowSpan,
            'className': className,
            'index': rowIndex,
            'colIndex': columnIndex
        };
        if (!option.rowSpan || option.rowSpan < 2) {
            delete option.rowSpan;
        }
        return new Cell(option);
    }
    processColumns(rows) {
        //TODO: generate dummy column for group, detail, stacked row here; ensureColumns here
        let gridObj = this.parent;
        let columnIndexes = this.parent.getColumnIndexesInView();
        for (let i = 0, len = rows.length; i < len; i++) {
            if (gridObj.allowGrouping) {
                for (let j = 0, len = gridObj.groupSettings.columns.length; j < len; j++) {
                    if (this.parent.enableColumnVirtualization && columnIndexes.indexOf(j) === -1) {
                        continue;
                    }
                    rows[i].cells.push(this.generateCell({}, CellType.HeaderIndent));
                }
            }
            if (gridObj.detailTemplate || gridObj.childGrid) {
                rows[i].cells.push(this.generateCell({}, CellType.DetailHeader));
            }
        }
        return rows;
    }
    /* tslint:disable:no-any */
    getCellCount(column, count) {
        if (column.columns) {
            for (let i = 0; i < column.columns.length; i++) {
                count = this.getCellCount(column.columns[i], count);
            }
        }
        else {
            if (column.visible || this.hideColumnInclude) {
                count++;
            }
        }
        return count;
    }
    /* tslint:disable:no-any */
    measureColumnDepth(column) {
        let max = 0;
        for (let i = 0; i < column.length; i++) {
            let depth = this.checkDepth(column[i], 0);
            if (max < depth) {
                max = depth;
            }
        }
        return max + 1;
    }
    /* tslint:disable:no-any */
    checkDepth(col, index) {
        if (col.columns) {
            index++;
            for (let i = 0; i < col.columns.length; i++) {
                index = this.checkDepth(col.columns[i], index);
            }
        }
        return index;
    }
    ;
}
/**
 * @hidden
 * `ExportValueFormatter` for `PdfExport` & `ExcelExport`
 */
class ExportValueFormatter {
    constructor() {
        this.valueFormatter = new ValueFormatter();
        this.internationalization = new Internationalization();
    }
    /* tslint:disable-next-line:no-any */
    returnFormattedValue(args, customFormat) {
        if (!isNullOrUndefined(args.value) && args.value) {
            return this.valueFormatter.getFormatFunction(customFormat)(args.value);
        }
        else {
            return '';
        }
    }
    /* tslint:disable-next-line:no-any */
    formatCellValue(args) {
        if (args.isForeignKey) {
            args.value = getValue(args.column.foreignKeyValue, getForeignData(args.column, {}, args.value)[0]);
        }
        if (args.column.type === 'number' && args.column.format !== undefined && args.column.format !== '') {
            return args.value ? this.internationalization.getNumberFormat({ format: args.column.format })(args.value) : '';
        }
        else if (args.column.type === 'boolean') {
            return args.value ? 'true' : 'false';
            /* tslint:disable-next-line:max-line-length */
        }
        else if ((args.column.type === 'date' || args.column.type === 'datetime' || args.column.type === 'time') && args.column.format !== undefined) {
            if (typeof args.column.format === 'string') {
                let format;
                if (args.column.type === 'date') {
                    format = { type: 'date', skeleton: args.column.format };
                }
                else if (args.column.type === 'time') {
                    format = { type: 'time', skeleton: args.column.format };
                }
                else {
                    format = { type: 'dateTime', skeleton: args.column.format };
                }
                return this.returnFormattedValue(args, format);
            }
            else {
                if (args.column.format instanceof Object && args.column.format.type === undefined) {
                    return (args.value.toString());
                }
                else {
                    /* tslint:disable-next-line:max-line-length */
                    let customFormat;
                    if (args.column.type === 'date') {
                        /* tslint:disable-next-line:max-line-length */
                        customFormat = { type: args.column.format.type, format: args.column.format.format, skeleton: args.column.format.skeleton };
                    }
                    else if (args.column.type === 'time') {
                        customFormat = { type: 'time', format: args.column.format.format, skeleton: args.column.format.skeleton };
                    }
                    else {
                        customFormat = { type: 'dateTime', format: args.column.format.format, skeleton: args.column.format.skeleton };
                    }
                    return this.returnFormattedValue(args, customFormat);
                }
            }
        }
        else {
            if (args.column.type === undefined || args.column.type === null) {
                return '';
            }
            else {
                return (args.value).toString();
            }
        }
    }
}

/**
 * @hidden
 * `ExcelExport` module is used to handle the Excel export action.
 */
class ExcelExport {
    /**
     * Constructor for the Grid Excel Export module.
     * @hidden
     */
    constructor(parent) {
        /* tslint:disable-next-line:no-any */
        this.book = {};
        /* tslint:disable-next-line:no-any */
        this.workSheet = [];
        /* tslint:disable-next-line:no-any */
        this.rows = [];
        /* tslint:disable-next-line:no-any */
        this.columns = [];
        /* tslint:disable-next-line:no-any */
        this.styles = [];
        this.rowLength = 1;
        this.expType = 'AppendToSheet';
        this.includeHiddenColumn = false;
        this.isCsvExport = false;
        this.isElementIdChanged = false;
        this.foreignKeyData = {};
        this.parent = parent;
        this.helper = new ExportHelper(parent);
    }
    /**
     * For internal use only - Get the module name.
     */
    getModuleName() {
        return 'ExcelExport';
    }
    init(gObj) {
        if (gObj.element !== null && gObj.element.id === '') {
            gObj.element.id = new Date().toISOString();
            this.isElementIdChanged = true;
        }
        this.parent = gObj;
        if (this.parent.isDestroyed) {
            return;
        }
        this.isExporting = undefined;
        this.book = {};
        /* tslint:disable-next-line:no-any */
        this.workSheet = [];
        /* tslint:disable-next-line:no-any */
        this.rows = [];
        /* tslint:disable-next-line:no-any */
        this.columns = [];
        /* tslint:disable-next-line:no-any */
        this.styles = [];
        this.rowLength = 1;
        /* tslint:disable-next-line:no-any */
        this.footer = undefined;
        this.expType = 'AppendToSheet';
        this.includeHiddenColumn = false;
        this.exportValueFormatter = new ExportValueFormatter();
    }
    /**
     * Export Grid to Excel file.
     * @param  {exportProperties} exportProperties - Defines the export properties of the Grid.
     * @param  {isMultipleExport} isMultipleExport - Defines is multiple Grid's are exported.
     * @param  {workbook} workbook - Defined the Workbook if multiple Grid is exported.
     * @param  {isCsv} isCsv - true if export to CSV.
     * @return {Promise<any>}
     */
    /* tslint:disable-next-line:max-line-length */
    /* tslint:disable-next-line:no-any */
    Map(grid, exportProperties, isMultipleExport, workbook, isCsv, isBlob) {
        let gObj = grid;
        gObj.trigger(beforeExcelExport);
        this.data = new Data(gObj);
        this.isExporting = true;
        this.isBlob = isBlob;
        if (isCsv) {
            this.isCsvExport = isCsv;
        }
        else {
            this.isCsvExport = false;
        }
        return this.processRecords(gObj, exportProperties, isMultipleExport, workbook);
    }
    /* tslint:disable-next-line:no-any */
    processRecords(gObj, exportProperties, isMultipleExport, workbook) {
        if (!isNullOrUndefined(exportProperties) && !isNullOrUndefined(exportProperties.dataSource) &&
            exportProperties.dataSource instanceof DataManager) {
            /* tslint:disable-next-line:no-any */
            let promise;
            return promise = new Promise((resolve, reject) => {
                /* tslint:disable-next-line:max-line-length */
                /* tslint:disable-next-line:no-any */
                let dataManager = exportProperties.dataSource.executeQuery(new Query());
                dataManager.then((r) => {
                    this.init(gObj);
                    this.processInnerRecords(gObj, exportProperties, isMultipleExport, workbook, r);
                    resolve(this.book);
                });
            });
        }
        else {
            /* tslint:disable-next-line:no-any */
            let allPromise = [];
            allPromise.push(this.data.getData({}, ExportHelper.getQuery(gObj, this.data)));
            allPromise.push(this.helper.getColumnData(gObj));
            let bool = true;
            return Promise.all(allPromise).then((e) => {
                if (bool) {
                    this.init(gObj);
                    this.processInnerRecords(gObj, exportProperties, isMultipleExport, workbook, e[0]);
                    bool = false;
                }
            }).catch((e) => {
                this.parent.trigger(actionFailure, e);
            });
        }
    }
    /* tslint:disable-next-line:max-line-length */
    /* tslint:disable-next-line:no-any */
    processInnerRecords(gObj, exportProperties, isMultipleExport, workbook, r) {
        let blankRows = 5;
        if (!isNullOrUndefined(exportProperties) && !isNullOrUndefined(exportProperties.multipleExport)) {
            /* tslint:disable-next-line:max-line-length */
            this.expType = (!isNullOrUndefined(exportProperties.multipleExport.type) ? exportProperties.multipleExport.type : 'AppendToSheet');
            if (!isNullOrUndefined(exportProperties.multipleExport.blankRows)) {
                blankRows = exportProperties.multipleExport.blankRows;
            }
        }
        if (isNullOrUndefined(workbook)) {
            this.workSheet = [];
            this.rows = [];
            this.columns = [];
            this.styles = [];
        }
        else if (this.expType === 'NewSheet') {
            this.workSheet = workbook.worksheets;
            this.rows = [];
            this.columns = [];
            this.styles = workbook.styles;
        }
        else {
            this.workSheet = [];
            this.rows = workbook.worksheets[0].rows;
            this.columns = workbook.worksheets[0].columns;
            this.styles = workbook.styles;
            this.rowLength = (this.rows[this.rows.length - 1].index + blankRows);
            this.rowLength++;
        }
        if (!isNullOrUndefined(exportProperties)) {
            if (!isNullOrUndefined(isMultipleExport)) {
                if (!isNullOrUndefined(exportProperties.header) && (isMultipleExport || this.expType === 'NewSheet')) {
                    this.processExcelHeader(JSON.parse(JSON.stringify(exportProperties.header)));
                }
                if (!isNullOrUndefined(exportProperties.footer)) {
                    if (this.expType === 'AppendToSheet') {
                        if (!isMultipleExport) {
                            this.footer = JSON.parse(JSON.stringify(exportProperties.footer));
                        }
                    }
                    else {
                        this.footer = JSON.parse(JSON.stringify(exportProperties.footer));
                    }
                }
            }
            else {
                if (!isNullOrUndefined(exportProperties.header)) {
                    this.processExcelHeader(JSON.parse(JSON.stringify(exportProperties.header)));
                }
                if (!isNullOrUndefined(exportProperties.footer)) {
                    this.footer = JSON.parse(JSON.stringify(exportProperties.footer));
                }
            }
        }
        this.includeHiddenColumn = (!isNullOrUndefined(exportProperties) ? exportProperties.includeHiddenColumn : false);
        /* tslint:disable-next-line:max-line-length */
        /* tslint:disable-next-line:no-any */
        let headerRow = this.helper.getHeaders(gObj.columns, this.includeHiddenColumn);
        let groupIndent = 0;
        /* tslint:disable:no-any */
        if (!isNullOrUndefined((r.result).level)) {
            groupIndent += (r.result).level;
            groupIndent += (r.result).childLevels;
        }
        /* tslint:enable:no-any */
        this.processHeaderContent(gObj, headerRow, exportProperties, groupIndent);
        /* tslint:disable-next-line:max-line-length */
        if (!isNullOrUndefined(exportProperties) && !isNullOrUndefined(exportProperties.dataSource) && !(exportProperties.dataSource instanceof DataManager)) {
            this.processRecordContent(gObj, r, headerRow, isMultipleExport, exportProperties.dataSource);
        }
        else if (!isNullOrUndefined(exportProperties) && exportProperties.exportType === 'CurrentPage') {
            this.processRecordContent(gObj, r, headerRow, isMultipleExport, gObj.getCurrentViewRecords());
        }
        else {
            this.processRecordContent(gObj, r, headerRow, isMultipleExport);
        }
        this.isExporting = false;
        gObj.trigger(excelExportComplete, this.isBlob ? { promise: this.blobPromise } : {});
    }
    /* tslint:disable-next-line:max-line-length */
    /* tslint:disable-next-line:no-any */
    processRecordContent(gObj, returnType, headerRow, isMultipleExport, currentViewRecords) {
        /* tslint:disable-next-line:no-any */
        let column = gObj.columns;
        /* tslint:disable-next-line:no-any */
        let record = undefined;
        if (!isNullOrUndefined(currentViewRecords)) {
            record = currentViewRecords;
        }
        else {
            record = returnType.result;
        }
        if (!isNullOrUndefined(record.level)) {
            this.processGroupedRows(gObj, record, headerRow, record.level);
        }
        else {
            this.processRecordRows(gObj, record, headerRow, 0);
        }
        if (!isNullOrUndefined(returnType.aggregates)) {
            if (!isNullOrUndefined(currentViewRecords)) {
                this.processAggregates(gObj, returnType.result, currentViewRecords);
            }
            else {
                this.processAggregates(gObj, returnType.result);
            }
        }
        //footer template add
        if (!isNullOrUndefined(this.footer)) {
            if ((this.expType === 'AppendToSheet' && !isMultipleExport) || (this.expType === 'NewSheet')) {
                this.processExcelFooter(this.footer);
            }
        }
        /* tslint:disable-next-line:no-any */
        let sheet = {};
        if (this.columns.length > 0) {
            sheet.columns = this.columns;
        }
        sheet.rows = this.rows;
        this.workSheet.push(sheet);
        this.book.worksheets = this.workSheet;
        this.book.styles = this.styles;
        if (!isMultipleExport) {
            if (this.isCsvExport) {
                let book = new Workbook(this.book, 'csv');
                if (!this.isBlob) {
                    book.save('Export.csv');
                }
                else {
                    this.blobPromise = book.saveAsBlob('text/csv');
                }
            }
            else {
                let book = new Workbook(this.book, 'xlsx');
                if (!this.isBlob) {
                    book.save('Export.xlsx');
                }
                else {
                    this.blobPromise = book.saveAsBlob('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                }
            }
            if (this.isElementIdChanged) {
                gObj.element.id = '';
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    processGroupedRows(gObj, dataSource, headerRow, level) {
        for (let item of dataSource) {
            /* tslint:disable-next-line:no-any */
            let cells = [];
            let index = 1;
            /* tslint:disable-next-line:no-any */
            let cell = {};
            cell.index = index + level;
            let col = gObj.getColumnByField(item.field);
            /* tslint:disable-next-line:no-any */
            let args = {
                value: item.key,
                column: col,
                style: undefined,
                isForeignKey: col.isForeignColumn(),
            };
            cell.value = item.field + ': ' + this.exportValueFormatter.formatCellValue(args) + ' - ';
            if (item.count > 1) {
                cell.value += item.count + ' items';
            }
            else {
                cell.value += item.count + ' item';
            }
            cell.style = this.getCaptionThemeStyle(this.theme);
            let captionModelGen = new CaptionSummaryModelGenerator(gObj);
            let groupCaptionSummaryRows = captionModelGen.generateRows(item);
            this.fillAggregates(gObj, groupCaptionSummaryRows, dataSource.level + dataSource.childLevels, this.rowLength);
            cells.push(cell);
            if (this.rows[this.rows.length - 1].cells.length > 0) {
                let lIndex = dataSource.level + dataSource.childLevels + groupCaptionSummaryRows[0].cells.length;
                let hIndex = 0;
                for (let tCell of this.rows[this.rows.length - 1].cells) {
                    if (tCell.index < lIndex) {
                        lIndex = tCell.index;
                    }
                    if (tCell.index > hIndex) {
                        hIndex = tCell.index;
                    }
                    tCell.style = this.getCaptionThemeStyle(this.theme);
                    if (cells[cells.length - 1].index !== tCell.index) {
                        cells.push(tCell);
                    }
                }
                if ((lIndex - cell.index) > 1) {
                    cell.colSpan = lIndex - cell.index;
                }
                while (hIndex < (headerRow.columns.length + level)) {
                    /* tslint:disable-next-line:no-any */
                    let sCell = {};
                    if (dataSource.childLevels === 0) {
                        sCell.index = (hIndex);
                    }
                    else {
                        sCell.index = (hIndex + 1);
                    }
                    sCell.style = this.getCaptionThemeStyle(this.theme);
                    cells.push(sCell);
                    hIndex++;
                }
            }
            else {
                let span = 0;
                //Calculation for column span when group caption dont have aggregates
                for (let col of headerRow.columns) {
                    if (col.visible) {
                        span++;
                    }
                }
                cell.colSpan = (dataSource.childLevels + span);
            }
            this.rows[this.rows.length - 1].cells = cells;
            this.rowLength++;
            if (!isNullOrUndefined(dataSource.childLevels) && dataSource.childLevels > 0) {
                this.processGroupedRows(gObj, item.items, headerRow, item.items.level);
            }
            else {
                this.processRecordRows(gObj, item.items, headerRow, (level));
                this.processAggregates(gObj, item, undefined, (level), true);
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    processRecordRows(gObj, record, headerRow, level) {
        let rLen = Object.keys(record).length;
        let index = 1;
        /* tslint:disable-next-line:no-any */
        let cells = [];
        for (let r = 0; r < rLen; r++) {
            cells = [];
            index = 1;
            for (let c = 0, len = headerRow.columns.length; c < len; c++) {
                /* tslint:disable-next-line:no-any */
                let value = !isNullOrUndefined(headerRow.columns[c].field) ? getValue(headerRow.columns[c].field, record[r]) : '';
                let column = headerRow.columns[c];
                let foreignKeyData$$1;
                // tslint:disable-next-line:max-line-length
                if (column.isForeignColumn && column.isForeignColumn()) {
                    foreignKeyData$$1 = this.helper.getFData(value, column);
                    value = getValue(column.foreignKeyValue, foreignKeyData$$1);
                }
                if (!isNullOrUndefined(value)) {
                    /* tslint:disable-next-line:no-any */
                    let excelCellArgs = { data: record[r], column: headerRow.columns[c], foreignKeyData: foreignKeyData$$1 };
                    gObj.trigger(excelQueryCellInfo, extend(excelCellArgs, {
                        column: headerRow.columns[c], data: record[r],
                        value: value, style: undefined, colSpan: 1
                    }));
                    /* tslint:disable-next-line:no-any */
                    let cell = {};
                    cell.index = index + level;
                    cell.value = excelCellArgs.value;
                    if (excelCellArgs.colSpan > 1) {
                        cell.colSpan = excelCellArgs.colSpan;
                    }
                    if (!isNullOrUndefined(excelCellArgs.style)) {
                        let styleIndex = this.getColumnStyle(gObj, index + level);
                        cell.style = this.mergeOptions(this.styles[styleIndex], excelCellArgs.style);
                    }
                    else {
                        cell.style = { name: gObj.element.id + 'column' + (index + level) };
                    }
                    cells.push(cell);
                }
                index++;
            }
            this.rows.push({ index: this.rowLength++, cells: cells });
        }
    }
    /* tslint:disable-next-line:no-any */
    processAggregates(gObj, rec, currentViewRecords, indent, byGroup) {
        let summaryModel = new SummaryModelGenerator(gObj);
        /* tslint:disable-next-line:no-any */
        let data = undefined;
        if (!isNullOrUndefined(currentViewRecords)) {
            data = currentViewRecords;
        }
        else {
            data = rec;
        }
        if (indent === undefined) {
            indent = 0;
        }
        if (gObj.groupSettings.columns.length > 0 && byGroup) {
            let groupSummaryModel = new GroupSummaryModelGenerator(gObj);
            let groupSummaryRows = groupSummaryModel.generateRows(data, { level: data.level });
            if (groupSummaryRows.length > 0) {
                this.fillAggregates(gObj, groupSummaryRows, indent);
            }
        }
        else {
            indent = gObj.groupSettings.columns.length > 0 && !byGroup ? gObj.groupSettings.columns.length : indent;
            let sRows = summaryModel.generateRows(data, rec.aggregates);
            if (sRows.length > 0 && !byGroup) {
                this.fillAggregates(gObj, sRows, indent);
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    fillAggregates(gObj, cells, indent, customIndex) {
        for (let row of cells) {
            /* tslint:disable-next-line:no-any */
            let cells = [];
            let index = 0;
            for (let cell of row.cells) {
                /* tslint:disable-next-line:no-any */
                let eCell = {};
                if ((cell.visible || this.includeHiddenColumn)) {
                    index++;
                    if (cell.isDataCell) {
                        eCell.index = index + indent;
                        if (!isNullOrUndefined(cell.column.footerTemplate)) {
                            eCell.value = this.getAggreateValue(CellType.Summary, cell.column.footerTemplate, cell, row);
                        }
                        else if (!isNullOrUndefined(cell.column.groupFooterTemplate)) {
                            eCell.value = this.getAggreateValue(CellType.GroupSummary, cell.column.groupFooterTemplate, cell, row);
                        }
                        else if (!isNullOrUndefined(cell.column.groupCaptionTemplate)) {
                            eCell.value = this.getAggreateValue(CellType.CaptionSummary, cell.column.groupCaptionTemplate, cell, row);
                        }
                        else {
                            for (let key of Object.keys(row.data[cell.column.field])) {
                                if (key === cell.column.type) {
                                    if (!isNullOrUndefined(row.data[cell.column.field].Sum)) {
                                        eCell.value = row.data[cell.column.field].Sum;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].Average)) {
                                        eCell.value = row.data[cell.column.field].Average;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].Max)) {
                                        eCell.value = row.data[cell.column.field].Max;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].Min)) {
                                        eCell.value = row.data[cell.column.field].Min;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].Count)) {
                                        eCell.value = row.data[cell.column.field].Count;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].TrueCount)) {
                                        eCell.value = row.data[cell.column.field].TrueCount;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].FalseCount)) {
                                        eCell.value = row.data[cell.column.field].FalseCount;
                                    }
                                    else if (!isNullOrUndefined(row.data[cell.column.field].Custom)) {
                                        eCell.value = row.data[cell.column.field].Custom;
                                    }
                                }
                            }
                        }
                        eCell.style = this.getCaptionThemeStyle(this.theme); //{ name: gObj.element.id + 'column' + index };
                        if (cell.attributes.style.textAlign) {
                            eCell.style.hAlign = cell.attributes.style.textAlign;
                        }
                        cells.push(eCell);
                    }
                    else {
                        if (customIndex === undefined) {
                            eCell.index = index + indent;
                            eCell.style = this.getCaptionThemeStyle(this.theme); //{ name: gObj.element.id + 'column' + index };
                            cells.push(eCell);
                        }
                    }
                }
            }
            if (!isNullOrUndefined(customIndex)) {
                this.rows.push({ index: customIndex, cells: cells });
            }
            else {
                this.rows.push({ index: this.rowLength++, cells: cells });
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    getAggreateValue(cellType, template, cell, row) {
        let templateFn = {};
        templateFn[getEnumValue(CellType, cell.cellType)] = compile(template);
        /* tslint:disable-next-line:max-line-length */
        let txt = (templateFn[getEnumValue(CellType, cell.cellType)](row.data[cell.column.field ? cell.column.field : cell.column.columnName]));
        return txt[0].wholeText;
    }
    /* tslint:disable-next-line:no-any */
    mergeOptions(JSON1, JSON2) {
        /* tslint:disable-next-line:no-any */
        let result = {};
        /* tslint:disable-next-line:no-any */
        let attrname = Object.keys(JSON1);
        for (let index = 0; index < attrname.length; index++) {
            if (attrname[index] !== 'name') {
                result[attrname[index]] = JSON1[attrname[index]];
            }
        }
        attrname = Object.keys(JSON2);
        for (let index = 0; index < attrname.length; index++) {
            if (attrname[index] !== 'name') {
                result[attrname[index]] = JSON2[attrname[index]];
            }
        }
        return result;
    }
    getColumnStyle(gObj, columnIndex) {
        let index = 0;
        for (let style of this.styles) {
            if (style.name === gObj.element.id + 'column' + columnIndex) {
                return index;
            }
            index++;
        }
        return undefined;
    }
    /* tslint:disable-next-line:no-any */
    processHeaderContent(gObj, headerRow, exportProperties, indent) {
        /* tslint:disable-next-line:no-any */
        let column = gObj.columns;
        let rowIndex = 1;
        /* tslint:disable-next-line:no-any */
        let returnValue = headerRow;
        /* tslint:enable:no-any */
        let gridRows = returnValue.rows;
        // Column collection with respect to the records in the grid
        let gridColumns = returnValue.columns;
        /* tslint:disable-next-line:no-any */
        let spannedCells = [];
        if (indent > 0) {
            let index = 0;
            while (index !== indent) {
                this.columns.push({ index: index + 1, width: 30 });
                index++;
            }
        }
        for (let row = 0; row < gridRows.length; row++) {
            let currentCellIndex = 1 + indent;
            /* tslint:disable-next-line:no-any */
            let cells = [];
            for (let column = 0; column < gridRows[row].cells.length; column++) {
                /* tslint:disable-next-line:no-any */
                let style = {};
                /* tslint:disable-next-line:no-any */
                let cell = {};
                /* tslint:disable-next-line:no-any */
                let gridCell = gridRows[row].cells[column];
                /* tslint:disable-next-line:no-any */
                let result = { contains: true, index: 1 };
                while (result.contains) {
                    result = this.getIndex(spannedCells, rowIndex, currentCellIndex);
                    currentCellIndex = result.index;
                    if (!result.contains) {
                        cell.index = result.index;
                        break;
                    }
                }
                if (!isNullOrUndefined(gridCell.rowSpan) && gridCell.rowSpan !== 1) {
                    cell.rowSpan = gridCell.rowSpan;
                    for (let i = rowIndex; i < gridCell.rowSpan + rowIndex; i++) {
                        /* tslint:disable-next-line:no-any */
                        let spannedCell = { rowIndex: 0, columnIndex: 0 };
                        spannedCell.rowIndex = i;
                        spannedCell.columnIndex = currentCellIndex;
                        spannedCells.push(spannedCell);
                    }
                }
                if (!isNullOrUndefined(gridCell.colSpan) && gridCell.colSpan !== 1) {
                    cell.colSpan = gridCell.colSpan;
                    currentCellIndex = currentCellIndex + cell.colSpan - 1;
                }
                cell.value = gridCell.column.headerText;
                if (!isNullOrUndefined(exportProperties) && !isNullOrUndefined(exportProperties.theme)) {
                    this.theme = exportProperties.theme;
                }
                style = this.getHeaderThemeStyle(this.theme);
                if (!isNullOrUndefined(gridCell.column.textAlign)) {
                    style.hAlign = gridCell.column.textAlign;
                }
                if (!isNullOrUndefined(gridCell.column.headerTextAlign)) {
                    style.hAlign = gridCell.column.headerTextAlign;
                }
                cell.style = style;
                cells.push(cell);
                currentCellIndex++;
            }
            this.rows.push({ index: this.rowLength++, cells: cells });
        }
        for (let col = 0; col < gridColumns.length; col++) {
            this.parseStyles(gObj, gridColumns[col], this.getRecordThemeStyle(this.theme), indent + col + 1);
        }
    }
    /* tslint:disable-next-line:no-any */
    getHeaderThemeStyle(theme) {
        /* tslint:disable-next-line:no-any */
        let style = {};
        style.fontSize = 12;
        style.borders = { color: '#E0E0E0' };
        if (!isNullOrUndefined(theme) && !isNullOrUndefined(theme.header)) {
            style = this.updateThemeStyle(theme.header, style);
        }
        return style;
    }
    /* tslint:disable-next-line:no-any */
    updateThemeStyle(themestyle, style) {
        if (!isNullOrUndefined(themestyle.fontColor)) {
            style.fontColor = themestyle.fontColor;
        }
        if (!isNullOrUndefined(themestyle.fontName)) {
            style.fontName = themestyle.fontName;
        }
        if (!isNullOrUndefined(themestyle.fontSize)) {
            style.fontSize = themestyle.fontSize;
        }
        if (!isNullOrUndefined(themestyle.borders)) {
            if (!isNullOrUndefined(themestyle.borders.color)) {
                style.borders.color = themestyle.borders.color;
            }
            if (!isNullOrUndefined(themestyle.borders.lineStyle)) {
                style.borders.lineStyle = themestyle.borders.lineStyle;
            }
        }
        if (themestyle.bold !== false) {
            style.bold = themestyle.bold;
        }
        return style;
    }
    /* tslint:disable-next-line:no-any */
    getCaptionThemeStyle(theme) {
        /* tslint:disable-next-line:no-any */
        let style = {};
        style.fontSize = 13;
        style.backColor = '#F6F6F6';
        if (!isNullOrUndefined(theme) && !isNullOrUndefined(theme.caption)) {
            style = this.updateThemeStyle(theme.caption, style);
        }
        return style;
    }
    /* tslint:disable-next-line:no-any */
    getRecordThemeStyle(theme) {
        /* tslint:disable-next-line:no-any */
        let style = {};
        style.fontSize = 13;
        style.borders = { color: '#E0E0E0' };
        if (!isNullOrUndefined(theme) && !isNullOrUndefined(theme.record)) {
            style = this.updateThemeStyle(theme.record, style);
        }
        return style;
    }
    /* tslint:disable-next-line:no-any */
    processExcelHeader(header) {
        if (!isNullOrUndefined(header.rows) && (this.expType === 'NewSheet' || this.rowLength === 1)) {
            let noRows;
            if (header.headerRows === undefined) {
                this.rowLength = header.rows.length;
            }
            else {
                this.rowLength = header.headerRows;
            }
            if (this.rowLength < header.rows.length) {
                noRows = this.rowLength;
            }
            else {
                noRows = header.rows.length;
            }
            this.rowLength++;
            for (let row = 0; row < noRows; row++) {
                /* tslint:disable-next-line:no-any */
                let json = header.rows[row];
                //Row index
                if (!(json.index !== null && !isNullOrUndefined(json.index))) {
                    json.index = (row + 1);
                }
                this.updatedCellIndex(json);
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    updatedCellIndex(json) {
        let cellsLength = json.cells.length;
        for (let cellId = 0; cellId < cellsLength; cellId++) {
            /* tslint:disable-next-line:no-any */
            let jsonCell = json.cells[cellId];
            //cell index
            if (!(jsonCell.index !== null && !isNullOrUndefined(jsonCell.index))) {
                jsonCell.index = (cellId + 1);
            }
        }
        this.rows.push(json);
    }
    /* tslint:disable-next-line:no-any */
    processExcelFooter(footer) {
        if (!isNullOrUndefined(footer.rows)) {
            let noRows;
            if (footer.footerRows === undefined) {
                this.rowLength += footer.rows.length;
            }
            else {
                if (footer.footerRows > footer.rows.length) {
                    this.rowLength += (footer.footerRows - footer.rows.length);
                    noRows = footer.rows.length;
                }
                else {
                    noRows = footer.footerRows;
                }
            }
            for (let row = 0; row < noRows; row++) {
                /* tslint:disable-next-line:no-any */
                let json = footer.rows[row];
                //Row index
                if (json.index === null || json.index === undefined) {
                    json.index = this.rowLength++;
                }
                else {
                    json.index += this.rowLength;
                }
                this.updatedCellIndex(json);
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    getIndex(spannedCells, rowIndex, columnIndex) {
        for (let spannedCell of spannedCells) {
            if ((spannedCell.rowIndex === rowIndex) && (spannedCell.columnIndex === columnIndex)) {
                columnIndex = columnIndex + 1;
                return { contains: true, index: columnIndex };
            }
        }
        return { contains: false, index: columnIndex };
    }
    /* tslint:disable-next-line:no-any */
    parseStyles(gObj, col, style, index) {
        if (!isNullOrUndefined(col.format)) {
            if (!isNullOrUndefined(col.format.skeleton)) {
                style.numberFormat = col.format.skeleton;
                if (!isNullOrUndefined(col.format.type)) {
                    style.type = col.format.type;
                }
            }
            else {
                style.numberFormat = col.format;
                style.type = col.type;
            }
        }
        if (!isNullOrUndefined(col.textAlign)) {
            style.hAlign = col.textAlign;
        }
        if (Object.keys(style).length > 0) {
            style.name = gObj.element.id + 'column' + index;
            this.styles.push(style);
        }
        if (!isNullOrUndefined(col.width)) {
            /* tslint:disable-next-line:max-line-length */
            this.columns.push({ index: index, width: typeof col.width === 'number' ? col.width : this.helper.getConvertedWidth(col.width) });
        }
    }
    /**
     * To destroy the excel export
     * @return {void}
     * @hidden
     */
    destroy() {
        //destroy for exporting
    }
}

/**
 * `PDF Export` module is used to handle the exportToPDF action.
 * @hidden
 */
class PdfExport {
    /**
     * Constructor for the Grid PDF Export module
     * @hidden
     */
    constructor(parent) {
        this.hideColumnInclude = false;
        this.currentViewData = false;
        this.customDataSource = false;
        this.isGrouping = false;
        this.parent = parent;
        this.helper = new ExportHelper(parent);
    }
    /**
     * For internal use only - Get the module name.
     */
    getModuleName() {
        return 'PdfExport';
    }
    init(parent) {
        this.exportValueFormatter = new ExportValueFormatter();
        this.pdfDocument = undefined;
        this.hideColumnInclude = false;
        this.currentViewData = false;
        this.parent = parent;
        let gObj = parent;
        this.isGrouping = false;
        this.isExporting = true;
        gObj.trigger(beforePdfExport);
    }
    /**
     * Used to map the input data
     * @return {void}
     */
    /* tslint:disable-next-line:no-any */
    Map(parent, pdfExportProperties, isMultipleExport, pdfDoc, isBlob) {
        this.data = new Data(this.parent);
        this.isBlob = isBlob;
        /* tslint:disable-next-line:max-line-length */
        if (!isNullOrUndefined(pdfExportProperties) && !isNullOrUndefined(pdfExportProperties.dataSource) && pdfExportProperties.dataSource instanceof DataManager) {
            let promise;
            return promise = new Promise((resolve, reject) => {
                /* tslint:disable-next-line:no-any */ /* tslint:disable-next-line:max-line-length */
                new DataManager({ url: pdfExportProperties.dataSource.dataSource.url, adaptor: pdfExportProperties.dataSource.adaptor }).executeQuery(new Query()).then((returnType) => {
                    this.init(parent);
                    if (!isNullOrUndefined(pdfDoc)) {
                        this.pdfDocument = pdfDoc;
                    }
                    else {
                        this.pdfDocument = new PdfDocument();
                    }
                    this.processExport(parent, returnType, pdfExportProperties, isMultipleExport);
                    this.isExporting = false;
                    parent.trigger(pdfExportComplete, this.isBlob ? { promise: this.blobPromise } : {});
                    resolve(this.pdfDocument);
                });
            });
        }
        else {
            let allPromise = [];
            allPromise.push(this.data.getData({}, ExportHelper.getQuery(parent, this.data)));
            allPromise.push(this.helper.getColumnData(parent));
            let bool = true;
            return Promise.all(allPromise).then((e) => {
                if (bool) {
                    this.init(parent);
                    if (!isNullOrUndefined(pdfDoc)) {
                        this.pdfDocument = pdfDoc;
                    }
                    else {
                        this.pdfDocument = new PdfDocument();
                    }
                    this.processExport(parent, e[0], pdfExportProperties, isMultipleExport);
                    this.isExporting = false;
                    parent.trigger(pdfExportComplete, this.isBlob ? { promise: this.blobPromise } : {});
                    bool = false;
                }
                // tslint:disable-next-line:no-any
            });
        }
    }
    /* tslint:disable:no-any */
    processExport(gObj, returnType, pdfExportProperties, isMultipleExport) {
        if (!isNullOrUndefined(pdfExportProperties)) {
            this.gridTheme = pdfExportProperties.theme;
        }
        let columns = gObj.columns;
        let dataSource = returnType.result;
        /* tslint:enable:no-any */
        let section = this.pdfDocument.sections.add();
        /* tslint:disable-next-line:no-any */
        let result = this.processExportProperties(pdfExportProperties, dataSource, section);
        dataSource = result.dataSource;
        /* tslint:disable-next-line:no-any */
        if (!isNullOrUndefined(dataSource.GroupGuid)) {
            this.isGrouping = true;
        }
        section = result.section;
        let pdfPage = section.pages.add();
        // create a grid
        let pdfGrid = new PdfGrid();
        // get header theme style
        /* tslint:disable-next-line:no-any */
        let headerThemeStyle = this.getHeaderThemeStyle();
        let border = headerThemeStyle.border;
        let headerFont = headerThemeStyle.font;
        let headerBrush = headerThemeStyle.brush;
        /* tslint:disable-next-line:no-any */
        let returnValue = this.helper.getHeaders(columns, this.hideColumnInclude);
        let rows = returnValue.rows;
        // Column collection with respect to the records in the grid
        let gridColumns = returnValue.columns;
        // process grid header content
        pdfGrid = this.processGridHeaders(dataSource.childLevels, pdfGrid, rows, gridColumns, border, headerFont, headerBrush);
        // set alignment, width and type of the values of the column
        this.setColumnProperties(gridColumns, pdfGrid);
        /* tslint:disable-next-line:no-any */
        let captionThemeStyle = this.getSummaryCaptionThemeStyle();
        if (!isNullOrUndefined(dataSource) && dataSource.length > 0) {
            if (this.isGrouping) {
                /* tslint:disable-next-line:max-line-length */
                this.processGroupedRecords(pdfGrid, dataSource, gridColumns, gObj, border, 0, captionThemeStyle.font, captionThemeStyle.brush, captionThemeStyle.backgroundBrush, returnType);
            }
            else {
                this.processRecord(border, gridColumns, gObj, dataSource, pdfGrid);
            }
            if (!isNullOrUndefined(returnType.aggregates)) {
                let summaryModel = new SummaryModelGenerator(gObj);
                let sRows;
                if (this.customDataSource) {
                    sRows = summaryModel.generateRows(dataSource, returnType.aggregates);
                }
                else if (this.currentViewData) {
                    sRows = summaryModel.generateRows(this.parent.getCurrentViewRecords(), returnType.aggregates);
                }
                else if (this.isGrouping) {
                    sRows = summaryModel.generateRows(dataSource.records, returnType.aggregates);
                }
                else {
                    sRows = summaryModel.generateRows(returnType.result, returnType.aggregates);
                }
                /* tslint:disable-next-line:max-line-length */
                this.processAggregates(sRows, pdfGrid, border, captionThemeStyle.font, captionThemeStyle.brush, captionThemeStyle.backgroundBrush, false);
            }
        }
        else {
            let row = pdfGrid.rows.addRow();
            row.style.setBorder(border);
        }
        // draw the grid
        pdfGrid.draw(pdfPage, 20, 20);
        if (!isMultipleExport) {
            // save the PDF
            if (!this.isBlob) {
                this.pdfDocument.save('Export.pdf');
            }
            else {
                this.blobPromise = this.pdfDocument.save();
            }
            this.pdfDocument.destroy();
        }
    }
    /* tslint:disable-next-line:no-any */
    getSummaryCaptionThemeStyle() {
        if (!isNullOrUndefined(this.gridTheme) && !isNullOrUndefined(this.gridTheme.caption) && this.gridTheme.caption !== null) {
            let fontSize = !isNullOrUndefined(this.gridTheme.caption.fontSize) ? this.gridTheme.caption.fontSize : 9.75;
            let pdfColor = new PdfColor();
            if (!isNullOrUndefined(this.gridTheme.caption.fontColor)) {
                let penBrushColor = this.hexToRgb(this.gridTheme.caption.fontColor);
                pdfColor = new PdfColor(penBrushColor.r, penBrushColor.g, penBrushColor.b);
            }
            /* tslint:disable-next-line:max-line-length */
            return { font: new PdfStandardFont(PdfFontFamily.Helvetica, 10.5), brush: new PdfSolidBrush(new PdfColor(pdfColor)), backgroundBrush: new PdfSolidBrush(new PdfColor(246, 246, 246)) };
        }
        else {
            //Material theme
            /* tslint:disable-next-line:max-line-length */
            return { font: new PdfStandardFont(PdfFontFamily.Helvetica, 9.75), brush: new PdfSolidBrush(new PdfColor(0, 0, 0)), backgroundBrush: new PdfSolidBrush(new PdfColor(246, 246, 246)) };
        }
    }
    /* tslint:disable-next-line:no-any */
    getHeaderThemeStyle() {
        let border = new PdfBorders();
        if (!isNullOrUndefined(this.gridTheme) && !isNullOrUndefined(this.gridTheme.header)) {
            if (!isNullOrUndefined(this.gridTheme.header.borders) && !isNullOrUndefined(this.gridTheme.header.borders.color)) {
                let borderColor = this.hexToRgb(this.gridTheme.header.borders.color);
                border.all = new PdfPen(new PdfColor(borderColor.r, borderColor.g, borderColor.b));
            }
            let fontSize = !isNullOrUndefined(this.gridTheme.header.fontSize) ? this.gridTheme.header.fontSize : 10.5;
            let pdfColor = new PdfColor();
            if (!isNullOrUndefined(this.gridTheme.header.fontColor)) {
                let penBrushColor = this.hexToRgb(this.gridTheme.header.fontColor);
                pdfColor = new PdfColor(penBrushColor.r, penBrushColor.g, penBrushColor.b);
            }
            /* tslint:disable-next-line:max-line-length */
            return { border: border, font: new PdfStandardFont(PdfFontFamily.Helvetica, fontSize), brush: new PdfSolidBrush(pdfColor) };
        }
        else {
            //Material theme
            border.all = new PdfPen(new PdfColor(234, 234, 234));
            /* tslint:disable-next-line:max-line-length */
            return { border: border, font: new PdfStandardFont(PdfFontFamily.Helvetica, 10.5), brush: new PdfSolidBrush(new PdfColor(102, 102, 102)) };
        }
    }
    /* tslint:disable-next-line:max-line-length */ /* tslint:disable-next-line:no-any */
    processGroupedRecords(pdfGrid, dataSource, gridColumns, gObj, border, level, font, brush, backgroundBrush, returnType) {
        let groupIndex = level;
        for (let dataSourceItems of dataSource) {
            let row = pdfGrid.rows.addRow();
            let col = gObj.getColumnByField(dataSourceItems.field);
            /* tslint:disable-next-line:no-any */
            let args = {
                value: dataSourceItems.key,
                column: col,
                style: undefined,
                isForeignKey: col.isForeignColumn(),
            };
            /* tslint:disable-next-line:max-line-length */
            let value = dataSourceItems.field + ': ' + this.exportValueFormatter.formatCellValue(args) + ' - ' + dataSourceItems.count + (dataSource.count > 1 ? ' items' : ' item');
            row.cells.getCell(groupIndex).value = value;
            row.cells.getCell(groupIndex + 1).style.stringFormat = new PdfStringFormat(PdfTextAlignment.Left);
            row.style.setBorder(border);
            row.style.setFont(font);
            row.style.setTextBrush(brush);
            row.style.setBackgroundBrush(backgroundBrush);
            let sRows;
            let captionSummaryModel = new CaptionSummaryModelGenerator(gObj);
            if (!isNullOrUndefined(dataSourceItems.items.records)) {
                sRows = captionSummaryModel.generateRows(dataSourceItems.items.records, returnType.aggregates);
            }
            else {
                sRows = captionSummaryModel.generateRows(dataSourceItems.items, returnType.aggregates);
            }
            if (!isNullOrUndefined(sRows) && sRows.length === 0) {
                row.cells.getCell(groupIndex + 1).columnSpan = pdfGrid.columns.count - (groupIndex + 1);
            }
            if (!isNullOrUndefined(dataSource.childLevels) && dataSource.childLevels > 0) {
                this.processAggregates(sRows, pdfGrid, border, font, brush, backgroundBrush, true, row, groupIndex);
                /* tslint:disable-next-line:max-line-length */
                this.processGroupedRecords(pdfGrid, dataSourceItems.items, gridColumns, gObj, border, (groupIndex + 1), font, brush, backgroundBrush, returnType);
                let groupSummaryModel = new GroupSummaryModelGenerator(gObj);
                sRows = groupSummaryModel.generateRows(dataSourceItems.items.records, returnType.aggregates);
                this.processAggregates(sRows, pdfGrid, border, font, brush, backgroundBrush, false);
            }
            else {
                this.processAggregates(sRows, pdfGrid, border, font, brush, backgroundBrush, true, row, groupIndex);
                this.processRecord(border, gridColumns, gObj, dataSourceItems.items, pdfGrid, (groupIndex + 1));
                let groupSummaryModel = new GroupSummaryModelGenerator(gObj);
                sRows = groupSummaryModel.generateRows(dataSourceItems.items, returnType.aggregates);
                this.processAggregates(sRows, pdfGrid, border, font, brush, backgroundBrush, false);
            }
        }
    }
    /* tslint:disable-next-line:max-line-length */
    processGridHeaders(childLevels, pdfGrid, rows, gridColumns, border, headerFont, headerBrush) {
        let columnCount = gridColumns.length;
        if (this.isGrouping) {
            columnCount += (childLevels + 1);
        }
        // add columns
        pdfGrid.columns.add(columnCount);
        if (this.isGrouping) {
            for (let i = 0; i < (childLevels + 1); i++) {
                pdfGrid.columns.getColumn(i).width = 20;
            }
        }
        // add header
        pdfGrid.headers.add(rows.length);
        // set cell values of each rows in the header
        for (let i = 0; i < rows.length; i++) {
            let gridHeader = pdfGrid.headers.getHeader(i);
            gridHeader.style.setBorder(border);
            gridHeader.style.setFont(headerFont);
            gridHeader.style.setTextBrush(headerBrush);
            let cellIndex = this.isGrouping ? (childLevels + 1) : 0;
            if (rows[i].cells.length === 0) {
                for (let j = 0; j < gridHeader.cells.count; j++) {
                    let cell = gridHeader.cells.getCell(j);
                    cell.value = '';
                }
            }
            else {
                for (let j = 0; j < cellIndex; j++) {
                    let cell = gridHeader.cells.getCell(j);
                    cell.value = '';
                }
                for (let j = 0; j < rows[i].cells.length; j++) {
                    let cell = gridHeader.cells.getCell(cellIndex);
                    if (cell.value !== null) {
                        cell.value = rows[i].cells[j].column.headerText;
                        if (!isNullOrUndefined(rows[i].cells[j].column.headerTextAlign)) {
                            cell.style.stringFormat = this.getHorizontalAlignment(rows[i].cells[j].column.headerTextAlign);
                        }
                        if (!isNullOrUndefined(rows[i].cells[j].rowSpan)) {
                            cell.rowSpan = rows[i].cells[j].rowSpan;
                            /* tslint:disable-next-line:max-line-length */
                            cell.style.stringFormat = this.getVerticalAlignment('Bottom', cell.style.stringFormat, rows[i].cells[j].column.textAlign);
                            for (let k = 1; k < rows[i].cells[j].rowSpan; k++) {
                                pdfGrid.headers.getHeader(i + k).cells.getCell(cellIndex).value = null;
                            }
                        }
                        if (!isNullOrUndefined(rows[i].cells[j].colSpan)) {
                            cell.columnSpan = rows[i].cells[j].colSpan;
                        }
                        cellIndex += cell.columnSpan;
                    }
                    else {
                        cell.value = '';
                        cellIndex += cell.columnSpan;
                        j = j - 1;
                    }
                }
            }
        }
        if (pdfGrid.columns.count >= 6) {
            pdfGrid.style.allowHorizontalOverflow = true;
        }
        return pdfGrid;
    }
    /* tslint:disable-next-line:no-any */ /* tslint:disable-next-line:max-line-length */
    processExportProperties(pdfExportProperties, dataSource, section) {
        if (!isNullOrUndefined(pdfExportProperties)) {
            if (!isNullOrUndefined(pdfExportProperties.theme)) {
                this.gridTheme = pdfExportProperties.theme;
            }
            if (!isNullOrUndefined(pdfExportProperties.pageOrientation) || !isNullOrUndefined(pdfExportProperties.pageSize)) {
                let pdfPageSettings = new PdfPageSettings();
                /* tslint:disable-next-line:max-line-length */
                pdfPageSettings.orientation = (pdfExportProperties.pageOrientation === 'Landscape') ? PdfPageOrientation.Landscape : PdfPageOrientation.Portrait;
                pdfPageSettings.size = this.getPageSize(pdfExportProperties.pageSize);
                section.setPageSettings(pdfPageSettings);
            }
            let clientSize = this.pdfDocument.pageSettings.size;
            if (!isNullOrUndefined(pdfExportProperties.header)) {
                /* tslint:disable-next-line:no-any */
                let header = pdfExportProperties.header;
                let position = new PointF(0, header.fromTop);
                let size = new SizeF((clientSize.width - 80), (header.height * 0.75));
                let bounds = new RectangleF(position, size);
                this.pdfDocument.template.top = this.drawPageTemplate(new PdfPageTemplateElement(bounds), header);
            }
            if (!isNullOrUndefined(pdfExportProperties.footer)) {
                /* tslint:disable-next-line:no-any */
                let footer = pdfExportProperties.footer;
                let position = new PointF(0, ((clientSize.width - 80) - (footer.fromBottom * 0.75)));
                let size = new SizeF((clientSize.width - 80), (footer.height * 0.75));
                let bounds = new RectangleF(position, size);
                this.pdfDocument.template.bottom = this.drawPageTemplate(new PdfPageTemplateElement(bounds), footer);
            }
            if (!isNullOrUndefined(pdfExportProperties.includeHiddenColumn) && !this.isGrouping) {
                this.hideColumnInclude = pdfExportProperties.includeHiddenColumn;
            }
            if (!isNullOrUndefined(pdfExportProperties.dataSource)) {
                if (!(pdfExportProperties.dataSource instanceof DataManager)) {
                    dataSource = pdfExportProperties.dataSource;
                }
                this.customDataSource = true;
                this.currentViewData = false;
            }
            else if (!isNullOrUndefined(pdfExportProperties.exportType)) {
                if (pdfExportProperties.exportType === 'CurrentPage') {
                    dataSource = this.parent.getCurrentViewRecords();
                    this.currentViewData = true;
                    this.customDataSource = false;
                }
                else {
                    this.currentViewData = false;
                    this.customDataSource = false;
                }
            }
            else {
                this.currentViewData = false;
                this.customDataSource = false;
            }
        }
        else {
            this.currentViewData = false;
            this.customDataSource = false;
        }
        return { dataSource: dataSource, section: section };
    }
    /* tslint:disable-next-line:no-any */
    drawPageTemplate(template, element) {
        for (let content of element.contents) {
            this.processContentValidation(content);
            switch (content.type) {
                case 'Text':
                    /* tslint:disable-next-line:max-line-length */
                    if (content.value === '' || content.value === undefined || content.value === null || typeof content.value !== 'string') {
                        throw new Error('please enter the valid input value in text content...');
                    }
                    this.drawText(template, content);
                    break;
                case 'PageNumber':
                    this.drawPageNumber(template, content);
                    break;
                case 'Image':
                    if (content.src === undefined || content.src === null || content.src === '') {
                        throw new Error('please enter the valid base64 string in image content...');
                    }
                    this.drawImage(template, content);
                    break;
                case 'Line':
                    this.drawLine(template, content);
                    break;
                default:
                    throw new Error('Please set valid content type...');
            }
        }
        return template;
    }
    /* tslint:disable-next-line:no-any */
    processContentValidation(content) {
        if (content.type === undefined || content.type === null) {
            throw new Error('please set valid content type...');
        }
        else {
            if (content.type === 'Line') {
                if (content.points === undefined || content.points === null) {
                    throw new Error('please enter valid points in ' + content.type + ' content...');
                }
                else {
                    if (content.points.x1 === undefined || content.points.x1 === null || typeof content.points.x1 !== 'number') {
                        throw new Error('please enter valid x1 co-ordinate in ' + content.type + ' points...');
                    }
                    if (content.points.y1 === undefined || content.points.y1 === null || typeof content.points.y1 !== 'number') {
                        throw new Error('please enter valid y1 co-ordinate in ' + content.type + ' points...');
                    }
                    if (content.points.x2 === undefined || content.points.x2 === null || typeof content.points.x2 !== 'number') {
                        throw new Error('please enter valid x2 co-ordinate in ' + content.type + ' points...');
                    }
                    if (content.points.y2 === undefined || content.points.y2 === null || typeof content.points.y2 !== 'number') {
                        throw new Error('please enter valid y2 co-ordinate in ' + content.type + ' points...');
                    }
                }
            }
            else {
                if (content.position === undefined || content.position === null) {
                    throw new Error('please enter valid position in ' + content.type + ' content...');
                }
                else {
                    if (content.position.x === undefined || content.position.x === null || typeof content.position.x !== 'number') {
                        throw new Error('please enter valid x co-ordinate in ' + content.type + ' position...');
                    }
                    if (content.position.y === undefined || content.position.y === null || typeof content.position.y !== 'number') {
                        throw new Error('please enter valid y co-ordinate in ' + content.type + ' position...');
                    }
                }
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    drawText(pageTemplate, content) {
        let font = this.getFont(content);
        let brush = this.getBrushFromContent(content);
        let pen = null;
        if (!isNullOrUndefined(content.style.textPenColor)) {
            let penColor = this.hexToRgb(content.style.textPenColor);
            pen = new PdfPen(new PdfColor(penColor.r, penColor.g, penColor.b));
        }
        if (brush == null && pen == null) {
            brush = new PdfSolidBrush(new PdfColor(0, 0, 0));
        }
        let value = content.value.toString();
        let x = content.position.x * 0.75;
        let y = content.position.y * 0.75;
        let format;
        let result = this.setContentFormat(content, format);
        if (result !== null && !isNullOrUndefined(result.format) && !isNullOrUndefined(result.size)) {
            pageTemplate.graphics.drawString(value, font, pen, brush, x, y, result.size.width, result.size.height, result.format);
        }
        else {
            pageTemplate.graphics.drawString(value, font, pen, brush, x, y, format);
        }
    }
    /* tslint:disable-next-line:no-any */
    drawPageNumber(documentHeader, content) {
        let font = this.getFont(content);
        let brush = null;
        if (!isNullOrUndefined(content.style.textBrushColor)) {
            /* tslint:disable-next-line:max-line-length */
            let brushColor = this.hexToRgb(content.style.textBrushColor);
            brush = new PdfSolidBrush(new PdfColor(brushColor.r, brushColor.g, brushColor.b));
        }
        else {
            brush = new PdfSolidBrush(new PdfColor(0, 0, 0));
        }
        let pageNumber = new PdfPageNumberField(font, brush);
        pageNumber.numberStyle = this.getPageNumberStyle(content.pageNumberType);
        let compositeField;
        let format;
        if (!isNullOrUndefined(content.format)) {
            if (content.format.indexOf('$total') !== -1 && content.format.indexOf('$current') !== -1) {
                let pageCount = new PdfPageCountField(font);
                if (content.format.indexOf('$total') > content.format.indexOf('$current')) {
                    format = content.format.replace('$current', '0');
                    format = format.replace('$total', '1');
                }
                else {
                    format = content.format.replace('$current', '1');
                    format = format.replace('$total', '0');
                }
                compositeField = new PdfCompositeField(font, brush, format, pageNumber, pageCount);
            }
            else if (content.format.indexOf('$current') !== -1 && content.format.indexOf('$total') === -1) {
                format = content.format.replace('$current', '0');
                compositeField = new PdfCompositeField(font, brush, format, pageNumber);
            }
            else {
                let pageCount = new PdfPageCountField(font);
                format = content.format.replace('$total', '0');
                compositeField = new PdfCompositeField(font, brush, format, pageCount);
            }
        }
        else {
            format = '{0}';
            compositeField = new PdfCompositeField(font, brush, format, pageNumber);
        }
        let x = content.position.x * 0.75;
        let y = content.position.y * 0.75;
        let result = this.setContentFormat(content, compositeField.stringFormat);
        if (result !== null && !isNullOrUndefined(result.format) && !isNullOrUndefined(result.size)) {
            compositeField.stringFormat = result.format;
            compositeField.bounds = new RectangleF(x, y, result.size.width, result.size.height);
        }
        compositeField.draw(documentHeader.graphics, x, y);
    }
    /* tslint:disable-next-line:no-any */
    drawImage(documentHeader, content) {
        let x = content.position.x * 0.75;
        let y = content.position.y * 0.75;
        let width = (!isNullOrUndefined(content.size)) ? (content.size.width * 0.75) : undefined;
        let height = (!isNullOrUndefined(content.size)) ? (content.size.height * 0.75) : undefined;
        let image = new PdfBitmap(content.src);
        if (!isNullOrUndefined(width)) {
            documentHeader.graphics.drawImage(image, x, y, width, height);
        }
        else {
            documentHeader.graphics.drawImage(image, x, y);
        }
    }
    /* tslint:disable-next-line:no-any */
    drawLine(documentHeader, content) {
        let x1 = content.points.x1 * 0.75;
        let y1 = content.points.y1 * 0.75;
        let x2 = content.points.x2 * 0.75;
        let y2 = content.points.y2 * 0.75;
        let pen = this.getPenFromContent(content);
        if (!isNullOrUndefined(content.style) && content.style !== null) {
            if (!isNullOrUndefined(content.style.penSize) && content.style.penSize !== null && typeof content.style.penSize === 'number') {
                pen.width = content.style.penSize * 0.75;
            }
            pen.dashStyle = this.getDashStyle(content.style.dashStyle);
        }
        documentHeader.graphics.drawLine(pen, x1, y1, x2, y2);
    }
    /* tslint:disable-next-line:no-any */ /* tslint:disable-next-line:max-line-length */
    processAggregates(sRows, pdfGrid, border, font, brush, backgroundBrush, isCaption, captionRow, groupIndex) {
        for (let row of sRows) {
            let leastCaptionSummaryIndex = -1;
            let index = 0;
            let isEmpty = true;
            /* tslint:disable-next-line:no-any */
            let value = [];
            for (let i = 0; i < pdfGrid.columns.count; i++) {
                /* tslint:disable-next-line:no-any */
                let cell = row.cells[index];
                if (!this.hideColumnInclude) {
                    while (cell.visible === undefined) {
                        if (!isNullOrUndefined(captionRow)) {
                            if (!isNullOrUndefined(captionRow.cells.getCell(i).value)) {
                                value.push('');
                                value.push(captionRow.cells.getCell(i).value);
                                isEmpty = false;
                                i += 1;
                            }
                            else {
                                value.push('');
                            }
                        }
                        else {
                            value.push('');
                        }
                        i += 1;
                        index = index + 1;
                        cell = row.cells[index];
                    }
                    while (!isNullOrUndefined(cell.visible) && !cell.visible) {
                        index = index + 1;
                        cell = row.cells[index];
                    }
                }
                if (cell.isDataCell) {
                    let templateFn = {};
                    /* tslint:disable-next-line:max-line-length */
                    if (!isNullOrUndefined(cell.column.footerTemplate) || !isNullOrUndefined(cell.column.groupCaptionTemplate) || !isNullOrUndefined(cell.column.groupFooterTemplate)) {
                        /* tslint:disable-next-line:no-any */
                        let result = this.getTemplateFunction(templateFn, i, leastCaptionSummaryIndex, cell.column);
                        templateFn = result.templateFunction;
                        leastCaptionSummaryIndex = result.leastCaptionSummaryIndex;
                        /* tslint:disable-next-line:max-line-length */
                        let txt = (templateFn[getEnumValue(CellType, cell.cellType)](row.data[cell.column.field ? cell.column.field : cell.column.columnName]));
                        value.push(txt[0].wholeText);
                        isEmpty = false;
                    }
                    else {
                        /* tslint:disable-next-line:no-any */
                        let result = this.getSummaryWithoutTemplate(row.data[cell.column.field]);
                        if (!isNullOrUndefined(result)) {
                            value.push(result);
                        }
                    }
                }
                else {
                    value.push('');
                }
                if (isEmpty && value[i] !== '' && !isNullOrUndefined(value[i]) && value[i] !== null) {
                    isEmpty = false;
                }
                index += 1;
            }
            if (!isEmpty) {
                if (!isCaption) {
                    let gridRow = pdfGrid.rows.addRow();
                    gridRow.style.setBorder(border);
                    gridRow.style.setFont(font);
                    gridRow.style.setTextBrush(brush);
                    gridRow.style.setBackgroundBrush(backgroundBrush);
                    for (let i = 0; i < pdfGrid.columns.count; i++) {
                        gridRow.cells.getCell(i).value = value[i].toString();
                    }
                }
                else {
                    for (let i = 0; i < pdfGrid.columns.count; i++) {
                        captionRow.cells.getCell(i).value = value[i].toString();
                        if (i === (groupIndex + 1) && leastCaptionSummaryIndex !== -1) {
                            captionRow.cells.getCell(i).columnSpan = leastCaptionSummaryIndex - (groupIndex + 1);
                        }
                        else if (i === (groupIndex + 1) && leastCaptionSummaryIndex === -1) {
                            captionRow.cells.getCell(i).columnSpan = pdfGrid.columns.count - (groupIndex + 1);
                        }
                    }
                }
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    getTemplateFunction(templateFn, index, leastCaptionSummaryIndex, column) {
        if (!isNullOrUndefined(column.footerTemplate)) {
            templateFn[getEnumValue(CellType, CellType.Summary)] = compile(column.footerTemplate);
        }
        else if (!isNullOrUndefined(column.groupCaptionTemplate)) {
            if (leastCaptionSummaryIndex === -1) {
                leastCaptionSummaryIndex = index;
            }
            templateFn[getEnumValue(CellType, CellType.CaptionSummary)] = compile(column.groupCaptionTemplate);
        }
        else {
            templateFn[getEnumValue(CellType, CellType.GroupSummary)] = compile(column.groupFooterTemplate);
        }
        return { templateFunction: templateFn, leastCaptionSummaryIndex: leastCaptionSummaryIndex };
    }
    /* tslint:disable-next-line:no-any */
    getSummaryWithoutTemplate(data) {
        if (!isNullOrUndefined(data.Sum)) {
            return data.Sum;
        }
        else if (!isNullOrUndefined(data.Average)) {
            return data.Average;
        }
        else if (!isNullOrUndefined(data.Max)) {
            return data.Max;
        }
        else if (!isNullOrUndefined(data.Min)) {
            return data.Min;
        }
        else if (!isNullOrUndefined(data.Count)) {
            return data.Count;
        }
        else if (!isNullOrUndefined(data.TrueCount)) {
            return data.TrueCount;
        }
        else if (!isNullOrUndefined(data.FalseCount)) {
            return data.FalseCount;
        }
        else if (!isNullOrUndefined(data.Custom)) {
            return data.Custom;
        }
    }
    // Set alignment, width and type of the values of the column
    /* tslint:disable:no-any */
    /* tslint:disable-next-line:max-line-length */
    setColumnProperties(gridColumns, pdfGrid) {
        let startIndex = this.isGrouping ? (pdfGrid.columns.count - gridColumns.length) : 0;
        for (let i = 0; i < gridColumns.length; i++) {
            if (!isNullOrUndefined(gridColumns[i].textAlign)) {
                pdfGrid.columns.getColumn(i + startIndex).format = this.getHorizontalAlignment(gridColumns[i].textAlign);
            }
            // Need to add width consideration with % value
            if (pdfGrid.style.allowHorizontalOverflow && !isNullOrUndefined(gridColumns[i].width)) {
                /* tslint:disable-next-line:max-line-length */
                pdfGrid.columns.getColumn(i + startIndex).width = typeof gridColumns[i].width === 'number' ? gridColumns[i].width * 0.75 : this.helper.getConvertedWidth(gridColumns[i].width) * 0.75;
            }
        }
    }
    /**
     * set default style properties of each rows in exporting grid
     * @private
     */
    setRecordThemeStyle(row, border) {
        if (!isNullOrUndefined(this.gridTheme) && !isNullOrUndefined(this.gridTheme.record) && this.gridTheme.record !== null) {
            let pdfColor = new PdfColor();
            if (!isNullOrUndefined(this.gridTheme.record.fontColor)) {
                let penBrushColor = this.hexToRgb(this.gridTheme.record.fontColor);
                pdfColor = new PdfColor(penBrushColor.r, penBrushColor.g, penBrushColor.b);
            }
            row.style.setTextBrush(new PdfSolidBrush(pdfColor));
        }
        else {
            row.style.setTextBrush(new PdfSolidBrush(new PdfColor(0, 0, 0)));
        }
        row.style.setBorder(border);
        return row;
    }
    /**
     * generate the formatted cell values
     * @private
     */
    /* tslint:disable-next-line:max-line-length */ /* tslint:disable-next-line:no-any */
    processRecord(border, columns, gObj, dataSource, pdfGrid, groupIndex) {
        let startIndex = this.isGrouping ? groupIndex : 0;
        for (let items of dataSource) {
            // create a new row and set default style properties
            let gridRow = this.setRecordThemeStyle(pdfGrid.rows.addRow(), border);
            for (let j = 0; j < columns.length; j++) {
                /* tslint:disable:no-any */
                let value = (!isNullOrUndefined(columns[j].field) && getValue(columns[j].field, items)) || '';
                let column = columns[j];
                let foreignKeyData$$1;
                if (column.isForeignColumn && column.isForeignColumn()) {
                    foreignKeyData$$1 = this.helper.getFData(value, column);
                    value = getValue(column.foreignKeyValue, foreignKeyData$$1);
                }
                let data = items;
                let args = {
                    data: data,
                    value: value,
                    column: column,
                    style: undefined,
                    colSpan: 1
                };
                /* tslint:enable:no-any */
                gObj.trigger(pdfQueryCellInfo, args);
                let cell = gridRow.cells.getCell(j + startIndex);
                cell.value = this.exportValueFormatter.formatCellValue(args);
                if (!isNullOrUndefined(args.style)) {
                    this.processCellStyle(cell, args);
                }
                if (args.colSpan > 1) {
                    if ((j + startIndex + 1 + args.colSpan) > gridRow.cells.count) {
                        args.colSpan = gridRow.cells.count - (j + startIndex + 1);
                    }
                    cell.columnSpan = args.colSpan;
                    for (let i = 1; i < cell.columnSpan; i++) {
                        let spanCell = gridRow.cells.getCell(j + startIndex + i);
                        spanCell.value = '';
                    }
                    j += (args.colSpan - 1);
                }
            }
        }
    }
    /* tslint:disable-next-line:no-any */
    processCellStyle(cell, args) {
        if (!isNullOrUndefined(args.style.backgroundColor)) {
            /* tslint:disable-next-line:max-line-length */
            let backColor = this.hexToRgb(args.style.backgroundColor);
            cell.style.backgroundBrush = new PdfSolidBrush(new PdfColor(backColor.r, backColor.g, backColor.b));
        }
        if (!isNullOrUndefined(args.style.textAlignment)) {
            cell.style.stringFormat = this.getHorizontalAlignment(args.style.textAlignment);
        }
        if (!isNullOrUndefined(args.style.verticalAlignment)) {
            cell.style.stringFormat = this.getVerticalAlignment(args.style.verticalAlignment, cell.style.stringFormat);
        }
        if (!isNullOrUndefined(args.style.textBrushColor)) {
            let textBrushColor = this.hexToRgb(args.style.textBrushColor);
            cell.style.textBrush = new PdfSolidBrush(new PdfColor(textBrushColor.r, textBrushColor.g, textBrushColor.b));
        }
        if (!isNullOrUndefined(args.style.textPenColor)) {
            let textPenColor = this.hexToRgb(args.style.textPenColor);
            cell.style.textPen = new PdfPen(new PdfColor(textPenColor.r, textPenColor.g, textPenColor.b));
        }
        /* tslint:disable-next-line:max-line-length */
        if (!isNullOrUndefined(args.style.fontFamily) || !isNullOrUndefined(args.style.fontSize) || !isNullOrUndefined(args.style.bold) || !isNullOrUndefined(args.style.italic) || !isNullOrUndefined(args.style.underline) || !isNullOrUndefined(args.style.strikeout)) {
            cell.style.font = this.getFont(args);
        }
        if (!isNullOrUndefined(args.style.border)) {
            let border = new PdfBorders();
            let borderWidth = args.style.border.width;
            // set border width
            let width = (!isNullOrUndefined(borderWidth) && typeof borderWidth === 'number') ? (borderWidth * 0.75) : (undefined);
            // set border color
            let color = new PdfColor(196, 196, 196);
            if (!isNullOrUndefined(args.style.border.color)) {
                let borderColor = this.hexToRgb(args.style.border.color);
                color = new PdfColor(borderColor.r, borderColor.g, borderColor.b);
            }
            let pen = new PdfPen(color, width);
            // set border dashStyle 'Solid <default>, Dash, Dot, DashDot, DashDotDot'
            if (!isNullOrUndefined(args.style.border.dashStyle)) {
                pen.dashStyle = this.getDashStyle(args.style.border.dashStyle);
            }
            border.all = pen;
            cell.style.borders = border;
        }
    }
    /**
     * set text alignment of each columns in exporting grid
     * @private
     */
    getHorizontalAlignment(textAlign, format) {
        if (format === undefined) {
            format = new PdfStringFormat();
        }
        switch (textAlign) {
            case 'Right':
                format.alignment = PdfTextAlignment.Right;
                break;
            case 'Center':
                format.alignment = PdfTextAlignment.Center;
                break;
            case 'Justify':
                format.alignment = PdfTextAlignment.Justify;
                break;
            case 'Left':
                format.alignment = PdfTextAlignment.Left;
                break;
        }
        return format;
    }
    /**
     * set vertical alignment of each columns in exporting grid
     * @private
     */
    getVerticalAlignment(verticalAlign, format, textAlign) {
        if (format === undefined) {
            format = new PdfStringFormat();
            format = this.getHorizontalAlignment(textAlign, format);
        }
        switch (verticalAlign) {
            case 'Bottom':
                format.lineAlignment = PdfVerticalAlignment.Bottom;
                break;
            case 'Middle':
                format.lineAlignment = PdfVerticalAlignment.Middle;
                break;
            case 'Top':
                format.lineAlignment = PdfVerticalAlignment.Top;
                break;
        }
        return format;
    }
    getFontFamily(fontFamily) {
        switch (fontFamily) {
            case 'TimesRoman':
                return 2;
            case 'Courier':
                return 1;
            case 'Symbol':
                return 3;
            case 'ZapfDingbats':
                return 4;
            default:
                return 0;
        }
    }
    /* tslint:disable-next-line:no-any */
    getFont(content) {
        let fontSize = (!isNullOrUndefined(content.style.fontSize)) ? (content.style.fontSize * 0.75) : 9.75;
        /* tslint:disable-next-line:max-line-length */
        let fontFamily = (!isNullOrUndefined(content.style.fontFamily)) ? (this.getFontFamily(content.style.fontFamily)) : PdfFontFamily.Helvetica;
        let fontStyle = PdfFontStyle.Regular;
        if (!isNullOrUndefined(content.style.bold) && content.style.bold) {
            fontStyle |= PdfFontStyle.Bold;
        }
        if (!isNullOrUndefined(content.style.italic) && content.style.italic) {
            fontStyle |= PdfFontStyle.Italic;
        }
        if (!isNullOrUndefined(content.style.underline) && content.style.underline) {
            fontStyle |= PdfFontStyle.Underline;
        }
        if (!isNullOrUndefined(content.style.strikeout) && content.style.strikeout) {
            fontStyle |= PdfFontStyle.Strikeout;
        }
        return new PdfStandardFont(fontFamily, fontSize, fontStyle);
    }
    getPageNumberStyle(pageNumberType) {
        switch (pageNumberType) {
            case 'LowerLatin':
                return 2;
            case 'LowerRoman':
                return 3;
            case 'UpperLatin':
                return 4;
            case 'UpperRoman':
                return 5;
            default:
                return 1;
        }
    }
    /* tslint:disable-next-line:max-line-length */ /* tslint:disable-next-line:no-any */
    setContentFormat(content, format) {
        if (!isNullOrUndefined(content.size)) {
            let width = content.size.width * 0.75;
            let height = content.size.height * 0.75;
            format = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle);
            if (!isNullOrUndefined(content.style.hAlign)) {
                switch (content.style.hAlign) {
                    case 'Right':
                        format.alignment = PdfTextAlignment.Right;
                        break;
                    case 'Center':
                        format.alignment = PdfTextAlignment.Center;
                        break;
                    case 'Justify':
                        format.alignment = PdfTextAlignment.Justify;
                        break;
                    default:
                        format.alignment = PdfTextAlignment.Left;
                }
            }
            if (!isNullOrUndefined(content.style.vAlign)) {
                format = this.getVerticalAlignment(content.style.vAlign, format);
            }
            return { format: format, size: new SizeF(width, height) };
        }
        return null;
    }
    getPageSize(pageSize) {
        switch (pageSize) {
            case 'Letter':
                return new SizeF(612, 792);
            case 'Note':
                return new SizeF(540, 720);
            case 'Legal':
                return new SizeF(612, 1008);
            case 'A0':
                return new SizeF(2380, 3368);
            case 'A1':
                return new SizeF(1684, 2380);
            case 'A2':
                return new SizeF(1190, 1684);
            case 'A3':
                return new SizeF(842, 1190);
            case 'A5':
                return new SizeF(421, 595);
            case 'A6':
                return new SizeF(297, 421);
            case 'A7':
                return new SizeF(210, 297);
            case 'A8':
                return new SizeF(148, 210);
            case 'A9':
                return new SizeF(105, 148);
            // case 'A10':
            //     return new SizeF(74, 105);
            case 'B0':
                return new SizeF(2836, 4008);
            case 'B1':
                return new SizeF(2004, 2836);
            case 'B2':
                return new SizeF(1418, 2004);
            case 'B3':
                return new SizeF(1002, 1418);
            case 'B4':
                return new SizeF(709, 1002);
            case 'B5':
                return new SizeF(501, 709);
            case 'Archa':
                return new SizeF(648, 864);
            case 'Archb':
                return new SizeF(864, 1296);
            case 'Archc':
                return new SizeF(1296, 1728);
            case 'Archd':
                return new SizeF(1728, 2592);
            case 'Arche':
                return new SizeF(2592, 3456);
            case 'Flsa':
                return new SizeF(612, 936);
            case 'HalfLetter':
                return new SizeF(396, 612);
            case 'Letter11x17':
                return new SizeF(792, 1224);
            case 'Ledger':
                return new SizeF(1224, 792);
            default:
                return new SizeF(595, 842);
        }
    }
    getDashStyle(dashStyle) {
        switch (dashStyle) {
            case 'Dash':
                return 1;
            case 'Dot':
                return 2;
            case 'DashDot':
                return 3;
            case 'DashDotDot':
                return 4;
            default:
                return 0;
        }
    }
    /* tslint:disable-next-line:no-any */
    getPenFromContent(content) {
        let pen = new PdfPen(new PdfColor(0, 0, 0));
        if (!isNullOrUndefined(content.style) && content.style !== null && !isNullOrUndefined(content.style.penColor)) {
            let penColor = this.hexToRgb(content.style.penColor);
            pen = new PdfPen(new PdfColor(penColor.r, penColor.g, penColor.b));
        }
        return pen;
    }
    /* tslint:disable-next-line:no-any */
    getBrushFromContent(content) {
        let brush = null;
        if (!isNullOrUndefined(content.style.textBrushColor)) {
            /* tslint:disable-next-line:max-line-length */
            let brushColor = this.hexToRgb(content.style.textBrushColor);
            brush = new PdfSolidBrush(new PdfColor(brushColor.r, brushColor.g, brushColor.b));
        }
        return brush;
    }
    hexToRgb(hex) {
        if (hex === null || hex === '' || hex.length !== 7) {
            throw new Error('please set valid hex value for color...');
        }
        hex = hex.substring(1);
        let bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return { r: r, g: g, b: b };
    }
    /**
     * To destroy the pdf export
     * @return {void}
     * @hidden
     */
    destroy() {
        //destroy for exporting
    }
}

/**
 * `CommandColumn` used to render command column in grid
 * @hidden
 */
class CommandColumnRenderer extends CellRenderer {
    constructor(parent, locator) {
        super(parent, locator);
        this.buttonElement = createElement('button', {});
        this.unbounDiv = createElement('div', { className: 'e-unboundcelldiv', styles: 'display: inline-block' });
        this.element = createElement('TD', {
            className: 'e-rowcell e-unboundcell', attrs: {
                role: 'gridcell', tabindex: '-1'
            }
        });
    }
    /**
     * Function to render the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data
     * @param  {{[x:string]:Object}} attributes?
     * @param  {Element}
     */
    render(cell, data, attributes$$1) {
        let node = this.element.cloneNode();
        node.appendChild(this.unbounDiv.cloneNode());
        node.setAttribute('aria-label', 'is Command column column header ' + cell.column.headerText);
        if (cell.column.commandsTemplate) {
            appendChildren(node.firstElementChild, cell.column.getColumnTemplate()(data));
        }
        else {
            for (let command of cell.commands) {
                node = this.renderButton(node, command, attributes$$1.index);
            }
        }
        this.setAttributes(node, cell, attributes$$1);
        if (this.parent.isEdit) {
            addClass(node.querySelectorAll('.e-edit-delete'), 'e-hide');
            removeClass(node.querySelectorAll('.e-save-cancel'), 'e-hide');
        }
        else {
            addClass(node.querySelectorAll('.e-save-cancel'), 'e-hide');
            removeClass(node.querySelectorAll('.e-edit-delete'), 'e-hide');
        }
        return node;
    }
    renderButton(node, buttonOption, index) {
        let button = this.buttonElement.cloneNode();
        attributes(button, {
            'id': this.parent.element.id + (buttonOption.type || '') + '_' + index, 'type': 'button',
            title: buttonOption.buttonOption.content || buttonOption.type
        });
        button.onclick = buttonOption.buttonOption.click;
        let buttonObj = new Button(buttonOption.buttonOption, button);
        buttonObj.commandType = buttonOption.type;
        node.firstElementChild.appendChild(buttonObj.element);
        switch (buttonOption.type) {
            case 'Edit':
            case 'Delete':
                addClass([button], ['e-edit-delete', 'e-' + buttonOption.type.toLowerCase() + 'button']);
                break;
            case 'Cancel':
            case 'Save':
                addClass([button], ['e-save-cancel', 'e-' + buttonOption.type.toLowerCase() + 'button']);
                break;
        }
        return node;
    }
}

/**
 * `CommandColumn` used to handle the command column actions.
 * @hidden
 */
class CommandColumn {
    constructor(parent, locator) {
        this.parent = parent;
        this.locator = locator;
        this.addEventListener();
    }
    initiateRender() {
        let cellFac = this.locator.getService('cellRendererFactory');
        cellFac.addCellRenderer(CellType.CommandColumn, new CommandColumnRenderer(this.parent, this.locator));
    }
    commandClickHandler(e) {
        let gObj = this.parent;
        let gID = gObj.element.id;
        let target = closest(e.target, 'button');
        if (!target || !gObj.editModule || !closest(e.target, '.e-unboundcell')) {
            return;
        }
        let buttonObj = target.ej2_instances[0];
        let type = buttonObj.commandType;
        if (buttonObj.disabled) {
            return;
        }
        switch (type) {
            case 'Edit':
                gObj.editModule.endEdit();
                gObj.editModule.startEdit(closest(target, 'tr'));
                break;
            case 'Cancel':
                gObj.editModule.closeEdit();
                break;
            case 'Save':
                gObj.editModule.endEdit();
                break;
            case 'Delete':
                gObj.editModule.endEdit();
                gObj.clearSelection();
                //for toogle issue when dbl click
                gObj.selectRow(parseInt(closest(target, 'tr').getAttribute('aria-rowindex'), 10), false);
                gObj.editModule.deleteRecord();
                break;
        }
    }
    /**
     * For internal use only - Get the module name.
     */
    getModuleName() {
        return 'commandColumn';
    }
    /**
     * To destroy CommandColumn.
     * @method destroy
     * @return {void}
     */
    destroy() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.removeEventListener();
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(click, this.commandClickHandler);
        this.parent.off(initialEnd, this.initiateRender);
        this.parent.off(keyPressed, this.keyPressHandler);
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(click, this.commandClickHandler, this);
        this.parent.on(initialEnd, this.initiateRender, this);
        this.parent.on(keyPressed, this.keyPressHandler, this);
    }
    keyPressHandler(e) {
        if (e.action === 'enter' && closest(e.target, '.e-unboundcelldiv')) {
            this.commandClickHandler(e);
            e.preventDefault();
        }
    }
}

const menuClass = {
    header: '.e-gridheader',
    content: '.e-gridcontent',
    edit: '.e-inline-edit',
    batchEdit: '.e-editedbatchcell',
    editIcon: 'e-edit',
    pager: '.e-gridpager',
    delete: 'e-delete',
    save: 'e-save',
    cancel: 'e-cancel',
    copy: 'e-copy',
    pdf: 'e-pdfexport',
    group: 'e-icon-group',
    ungroup: 'e-icon-ungroup',
    csv: 'e-csvexport',
    excel: 'e-excelexport',
    fPage: 'e-icon-first',
    nPage: 'e-icon-next',
    lPage: 'e-icon-last',
    pPage: 'e-icon-prev',
    ascending: 'e-icon-ascending',
    descending: 'e-icon-descending',
    groupHeader: 'e-groupdroparea',
    touchPop: 'e-gridpopup'
};
/**
 * The `ContextMenu` module is used to handle context menu actions.
 */
class ContextMenu$1 {
    constructor(parent, serviceLocator) {
        this.defaultItems = {};
        this.disableItems = [];
        this.hiddenItems = [];
        this.localeText = this.setLocaleKey();
        this.parent = parent;
        this.gridID = parent.element.id;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(uiUpdate, this.enableAfterRenderMenu, this);
        this.parent.on(initialLoad, this.render, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialLoad, this.render);
        this.parent.off(uiUpdate, this.enableAfterRenderMenu);
        EventHandler.remove(this.element, 'keydown', this.keyDownHandler.bind(this));
    }
    keyDownHandler(e) {
        if (e.code === 'Tab' || e.which === 9) {
            this.contextMenu.close();
        }
    }
    render() {
        this.parent.element.classList.add('e-noselect');
        this.l10n = this.serviceLocator.getService('localization');
        this.element = createElement('ul', { id: this.gridID + '_cmenu' });
        EventHandler.add(this.element, 'keydown', this.keyDownHandler.bind(this));
        this.parent.element.appendChild(this.element);
        let target = '#' + this.gridID;
        this.contextMenu = new ContextMenu({
            items: this.getMenuItems(),
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            locale: this.parent.locale,
            target: target,
            select: this.contextMenuItemClick.bind(this),
            beforeOpen: this.contextMenuBeforeOpen.bind(this),
            onOpen: this.contextMenuOpen.bind(this),
            onClose: this.contextMenuOnClose.bind(this),
            cssClass: 'e-grid-menu'
        });
        this.contextMenu.appendTo(this.element);
    }
    enableAfterRenderMenu(e) {
        if (e.module === this.getModuleName() && e.enable) {
            if (this.contextMenu) {
                this.contextMenu.destroy();
                remove(this.element);
                this.parent.element.classList.remove('e-noselect');
            }
            this.render();
        }
    }
    getMenuItems() {
        let menuItems = [];
        let exportItems = [];
        for (let item of this.parent.contextMenuItems) {
            if (typeof item === 'string' && this.getDefaultItems().indexOf(item) !== -1) {
                if (item.toLocaleLowerCase().indexOf('export') !== -1) {
                    exportItems.push(this.buildDefaultItems(item));
                }
                else {
                    menuItems.push(this.buildDefaultItems(item));
                }
            }
            else if (typeof item !== 'string') {
                menuItems.push(item);
            }
        }
        if (exportItems.length > 0) {
            let exportGroup = this.buildDefaultItems('export');
            exportGroup.items = exportItems;
            menuItems.push(exportGroup);
        }
        return menuItems;
    }
    getLastPage() {
        let totalpage = Math.floor(this.parent.pageSettings.totalRecordsCount / this.parent.pageSettings.pageSize);
        if (this.parent.pageSettings.totalRecordsCount % this.parent.pageSettings.pageSize) {
            totalpage += 1;
        }
        return totalpage;
    }
    contextMenuOpen() {
        this.isOpen = true;
    }
    contextMenuItemClick(args) {
        let item = this.getKeyFromId(args.item.id);
        switch (item) {
            case 'AutoFitAll':
                this.parent.autoFitColumns([]);
                break;
            case 'AutoFit':
                this.parent.autoFitColumns(this.targetColumn.field);
                break;
            case 'Group':
                this.parent.groupColumn(this.targetColumn.field);
                break;
            case 'Ungroup':
                this.parent.ungroupColumn(this.targetColumn.field);
                break;
            case 'Edit':
                if (this.parent.editSettings.mode === 'Batch') {
                    if (this.row && this.cell && !isNaN(parseInt(this.cell.getAttribute('aria-colindex'), 10))) {
                        this.parent.editModule.editCell(parseInt(this.row.getAttribute('aria-rowindex'), 10), this.parent.getColumns()[parseInt(this.cell.getAttribute('aria-colindex'), 10)].field);
                    }
                }
                else {
                    this.parent.editModule.endEdit();
                    this.parent.editModule.startEdit(this.row);
                }
                break;
            case 'Delete':
                if (this.parent.editSettings.mode !== 'Batch') {
                    this.parent.editModule.endEdit();
                }
                this.parent.editModule.deleteRow(this.row);
                break;
            case 'Save':
                this.parent.editModule.endEdit();
                break;
            case 'Cancel':
                this.parent.editModule.closeEdit();
                break;
            case 'Copy':
                this.parent.copy();
                break;
            case 'PdfExport':
                this.parent.pdfExport();
                break;
            case 'ExcelExport':
                this.parent.excelExport();
                break;
            case 'CsvExport':
                this.parent.csvExport();
                break;
            case 'SortAscending':
                this.isOpen = false;
                this.parent.sortColumn(this.targetColumn.field, 'Ascending');
                break;
            case 'SortDescending':
                this.isOpen = false;
                this.parent.sortColumn(this.targetColumn.field, 'Descending');
                break;
            case 'FirstPage':
                this.parent.goToPage(1);
                break;
            case 'PrevPage':
                this.parent.goToPage(this.parent.pageSettings.currentPage - 1);
                break;
            case 'LastPage':
                this.parent.goToPage(this.getLastPage());
                break;
            case 'NextPage':
                this.parent.goToPage(this.parent.pageSettings.currentPage + 1);
                break;
        }
        args.column = this.targetColumn;
        this.parent.trigger(contextMenuClick, args);
    }
    contextMenuOnClose(args) {
        let parent = 'parentObj';
        if (args.items.length > 0 && args.items[0][parent] instanceof ContextMenu) {
            this.updateItemStatus();
        }
    }
    getLocaleText(item) {
        return this.l10n.getConstant(this.localeText[item]);
    }
    updateItemStatus() {
        this.contextMenu.showItems(this.hiddenItems);
        this.contextMenu.enableItems(this.disableItems);
        this.hiddenItems = [];
        this.disableItems = [];
        this.isOpen = false;
    }
    contextMenuBeforeOpen(args) {
        let changedRecords = 'changedRecords';
        let addedRecords = 'addedRecords';
        let deletedRecords = 'deletedRecords';
        let closestGrid = closest(args.event.target, '.e-grid');
        if (args.event && closestGrid && closestGrid !== this.parent.element) {
            args.cancel = true;
        }
        else if (args.event && (closest(args.event.target, '.' + menuClass.groupHeader)
            || closest(args.event.target, '.' + menuClass.touchPop) ||
            closest(args.event.target, '.e-summarycell') ||
            closest(args.event.target, '.e-groupcaption') ||
            closest(args.event.target, '.e-filterbarcell'))) {
            args.cancel = true;
        }
        else {
            this.targetColumn = this.getColumn(args.event);
            this.selectRow(args.event, this.parent.selectionSettings.type !== 'Multiple');
            for (let item of args.items) {
                let key = this.getKeyFromId(item.id);
                let dItem = this.defaultItems[key];
                if (this.getDefaultItems().indexOf(key) !== -1) {
                    if (this.ensureDisabledStatus(key)) {
                        this.disableItems.push(item.text);
                    }
                    if (args.event && (this.ensureTarget(args.event.target, menuClass.edit) ||
                        this.ensureTarget(args.event.target, menuClass.batchEdit))) {
                        if (key !== 'Save' && key !== 'Cancel') {
                            this.hiddenItems.push(item.text);
                        }
                    }
                    else if (this.parent.editSettings.mode === 'Batch' && ((closest(args.event.target, '.e-gridform')) ||
                        this.parent.editModule.getBatchChanges()[changedRecords].length ||
                        this.parent.editModule.getBatchChanges()[addedRecords].length ||
                        this.parent.editModule.getBatchChanges()[deletedRecords].length) && (key === 'Save' || key === 'Cancel')) {
                        continue;
                    }
                    else if (isNullOrUndefined(args.parentItem) && args.event
                        && !this.ensureTarget(args.event.target, dItem.target)) {
                        this.hiddenItems.push(item.text);
                    }
                }
                else if (item.target && args.event &&
                    !this.ensureTarget(args.event.target, item.target)) {
                    this.hiddenItems.push(item.text);
                }
            }
            this.contextMenu.enableItems(this.disableItems, false);
            this.contextMenu.hideItems(this.hiddenItems);
            this.eventArgs = args.event;
            args.column = this.targetColumn;
            this.parent.trigger(contextMenuOpen, args);
            if (this.hiddenItems.length === args.items.length) {
                this.updateItemStatus();
                args.cancel = true;
            }
        }
    }
    ensureTarget(targetElement, selector) {
        let target = targetElement;
        if (this.ensureFrozenHeader(targetElement) && (selector === menuClass.header || selector === menuClass.content)) {
            target = closest(targetElement, selector === menuClass.header ? 'thead' : 'tbody');
        }
        else if (selector === menuClass.content || selector === menuClass.header) {
            target = parentsUntil(closest(targetElement, '.e-table'), selector.substr(1, selector.length));
        }
        else {
            target = closest(targetElement, selector);
        }
        return target && parentsUntil(target, 'e-grid') === this.parent.element;
    }
    ensureFrozenHeader(targetElement) {
        return (this.parent.getFrozenColumns() || this.parent.frozenRows)
            && closest(targetElement, menuClass.header) ? true : false;
    }
    ensureDisabledStatus(item) {
        let status = false;
        switch (item) {
            case 'AutoFitAll':
            case 'AutoFit':
                status = !(this.parent.ensureModuleInjected(Resize) && !this.parent.isEdit);
                break;
            case 'Group':
                if (!this.parent.allowGrouping || (this.parent.ensureModuleInjected(Group) && this.targetColumn
                    && this.parent.groupSettings.columns.indexOf(this.targetColumn.field) >= 0)) {
                    status = true;
                }
                break;
            case 'Ungroup':
                if (!this.parent.allowGrouping || !this.parent.ensureModuleInjected(Group)
                    || (this.parent.ensureModuleInjected(Group) && this.targetColumn
                        && this.parent.groupSettings.columns.indexOf(this.targetColumn.field) < 0)) {
                    status = true;
                }
                break;
            case 'Edit':
            case 'Delete':
            case 'Save':
            case 'Cancel':
                if (!this.parent.editModule || (this.parent.getDataRows().length === 0)) {
                    status = true;
                }
                break;
            case 'Copy':
                if (this.parent.getSelectedRowIndexes().length === 0 ||
                    this.parent.getCurrentViewRecords().length === 0) {
                    status = true;
                }
                break;
            case 'export':
                if ((!this.parent.allowExcelExport || !this.parent.excelExport) ||
                    !this.parent.ensureModuleInjected(PdfExport) && !this.parent.ensureModuleInjected(ExcelExport)) {
                    status = true;
                }
                break;
            case 'PdfExport':
                if (!(this.parent.allowPdfExport) || !this.parent.ensureModuleInjected(PdfExport)) {
                    status = true;
                }
                break;
            case 'ExcelExport':
            case 'CsvExport':
                if (!(this.parent.allowExcelExport) || !this.parent.ensureModuleInjected(ExcelExport)) {
                    status = true;
                }
                break;
            case 'SortAscending':
            case 'SortDescending':
                if ((!this.parent.allowSorting) || !this.parent.ensureModuleInjected(Sort)) {
                    status = true;
                }
                else if (this.parent.ensureModuleInjected(Sort) && this.parent.sortSettings.columns.length > 0 && this.targetColumn) {
                    this.parent.sortSettings.columns.forEach((element) => {
                        if (element.field === this.targetColumn.field
                            && element.direction.toLowerCase() === item.toLowerCase().replace('sort', '').toLocaleLowerCase()) {
                            status = true;
                        }
                    });
                }
                break;
            case 'FirstPage':
            case 'PrevPage':
                if (!this.parent.allowPaging || !this.parent.ensureModuleInjected(Page) ||
                    this.parent.getCurrentViewRecords().length === 0 ||
                    (this.parent.ensureModuleInjected(Page) && this.parent.pageSettings.currentPage === 1)) {
                    status = true;
                }
                break;
            case 'LastPage':
            case 'NextPage':
                if (!this.parent.allowPaging || !this.parent.ensureModuleInjected(Page) ||
                    this.parent.getCurrentViewRecords().length === 0 ||
                    (this.parent.ensureModuleInjected(Page) && this.parent.pageSettings.currentPage === this.getLastPage())) {
                    status = true;
                }
                break;
        }
        return status;
    }
    /**
     * Gets the context menu element from the Grid.
     * @return {Element}
     */
    getContextMenu() {
        return this.element;
    }
    /**
     * Destroys the context menu component in the Grid.
     * @method destroy
     * @return {void}
     * @hidden
     */
    destroy() {
        this.contextMenu.destroy();
        remove(this.element);
        this.removeEventListener();
        this.parent.element.classList.remove('e-noselect');
    }
    getModuleName() {
        return 'contextMenu';
    }
    generateID(item) {
        return this.gridID + '_cmenu_' + item;
    }
    getKeyFromId(id) {
        return id.replace(this.gridID + '_cmenu_', '');
    }
    buildDefaultItems(item) {
        let menuItem;
        switch (item) {
            case 'AutoFitAll':
            case 'AutoFit':
                menuItem = { target: menuClass.header };
                break;
            case 'Group':
                menuItem = { target: menuClass.header, iconCss: menuClass.group };
                break;
            case 'Ungroup':
                menuItem = { target: menuClass.header, iconCss: menuClass.ungroup };
                break;
            case 'Edit':
                menuItem = { target: menuClass.content, iconCss: menuClass.editIcon };
                break;
            case 'Delete':
                menuItem = { target: menuClass.content, iconCss: menuClass.delete };
                break;
            case 'Save':
                menuItem = { target: menuClass.edit, iconCss: menuClass.save };
                break;
            case 'Cancel':
                menuItem = { target: menuClass.edit, iconCss: menuClass.cancel };
                break;
            case 'Copy':
                menuItem = { target: menuClass.content, iconCss: menuClass.copy };
                break;
            case 'export':
                menuItem = { target: menuClass.content };
                break;
            case 'PdfExport':
                menuItem = { target: menuClass.content, iconCss: menuClass.pdf };
                break;
            case 'ExcelExport':
                menuItem = { target: menuClass.content, iconCss: menuClass.excel };
                break;
            case 'CsvExport':
                menuItem = { target: menuClass.content, iconCss: menuClass.csv };
                break;
            case 'SortAscending':
                menuItem = { target: menuClass.header, iconCss: menuClass.ascending };
                break;
            case 'SortDescending':
                menuItem = { target: menuClass.header, iconCss: menuClass.descending };
                break;
            case 'FirstPage':
                menuItem = { target: menuClass.pager, iconCss: menuClass.fPage };
                break;
            case 'PrevPage':
                menuItem = { target: menuClass.pager, iconCss: menuClass.pPage };
                break;
            case 'LastPage':
                menuItem = { target: menuClass.pager, iconCss: menuClass.lPage };
                break;
            case 'NextPage':
                menuItem = { target: menuClass.pager, iconCss: menuClass.nPage };
                break;
        }
        this.defaultItems[item] = {
            text: this.getLocaleText(item), id: this.generateID(item),
            target: menuItem.target, iconCss: menuItem.iconCss ? 'e-icons ' + menuItem.iconCss : ''
        };
        return this.defaultItems[item];
    }
    getDefaultItems() {
        return ['AutoFitAll', 'AutoFit',
            'Group', 'Ungroup', 'Edit', 'Delete', 'Save', 'Cancel', 'Copy', 'export',
            'PdfExport', 'ExcelExport', 'CsvExport', 'SortAscending', 'SortDescending',
            'FirstPage', 'PrevPage', 'LastPage', 'NextPage'];
    }
    setLocaleKey() {
        return {
            'AutoFitAll': 'autoFitAll',
            'AutoFit': 'autoFit',
            'Copy': 'Copy',
            'Group': 'Group',
            'Ungroup': 'Ungroup',
            'Edit': 'EditRecord',
            'Delete': 'DeleteRecord',
            'Save': 'Save',
            'Cancel': 'CancelButton',
            'PdfExport': 'Pdfexport',
            'ExcelExport': 'Excelexport',
            'CsvExport': 'Csvexport',
            'export': 'Export',
            'SortAscending': 'SortAscending',
            'SortDescending': 'SortDescending',
            'FirstPage': 'FirstPage',
            'LastPage': 'LastPage',
            'PrevPage': 'PreviousPage',
            'NextPage': 'NextPage'
        };
    }
    getColumn(e) {
        let cell = closest(e.target, 'th.e-headercell');
        if (cell) {
            cell.classList.add('e-resized');
            let uid = cell.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
            return this.parent.getColumnByUid(uid);
        }
        return null;
    }
    selectRow(e, isSelectable) {
        this.cell = e.target;
        this.row = closest(e.target, 'tr.e-row') || this.row;
        if (this.row && isSelectable) {
            this.parent.selectRow(parseInt(this.row.getAttribute('aria-rowindex'), 10));
        }
    }
}

/**
 * FreezeRowModelGenerator is used to generate grid data rows with freeze row and column.
 * @hidden
 */
class FreezeRowModelGenerator {
    constructor(parent) {
        this.isFrzLoad = 1;
        this.parent = parent;
        this.rowModelGenerator = new RowModelGenerator(this.parent);
    }
    generateRows(data, notifyArgs) {
        let frzCols = this.parent.getFrozenColumns();
        let row = this.rowModelGenerator.generateRows(data, notifyArgs);
        for (let i = 0, len = row.length; i < len; i++) {
            if (this.isFrzLoad % 2 === 0) {
                row[i].cells = row[i].cells.slice(frzCols, row[i].cells.length);
            }
            else {
                row[i].cells = row[i].cells.slice(0, frzCols);
            }
        }
        this.isFrzLoad++;
        return row;
    }
}

/**
 * Freeze module is used to render grid content with frozen rows and columns
 * @hidden
 */
class FreezeContentRender extends ContentRender {
    constructor(parent, locator) {
        super(parent, locator);
    }
    renderPanel() {
        super.renderPanel();
        let fDiv = createElement('div', { className: 'e-frozencontent' });
        let mDiv = createElement('div', { className: 'e-movablecontent' });
        this.getPanel().firstChild.appendChild(fDiv);
        this.getPanel().firstChild.appendChild(mDiv);
        this.setFrozenContent(fDiv);
        this.setMovableContent(mDiv);
    }
    renderEmpty(tbody) {
        super.renderEmpty(tbody);
        this.getMovableContent().querySelector('tbody').innerHTML = '<tr><td></td></tr>';
        this.getFrozenContent().querySelector('.e-emptyrow').querySelector('td').colSpan = this.parent.getFrozenColumns();
        this.getFrozenContent().style.borderRightWidth = '0px';
        if (this.parent.frozenRows) {
            this.parent.getHeaderContent().querySelector('.e-frozenheader').querySelector('tbody').innerHTML = '';
            this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('tbody').innerHTML = '';
        }
    }
    setFrozenContent(ele) {
        this.frozenContent = ele;
    }
    setMovableContent(ele) {
        this.movableContent = ele;
    }
    getFrozenContent() {
        return this.frozenContent;
    }
    getMovableContent() {
        return this.movableContent;
    }
    getModelGenerator() {
        return new FreezeRowModelGenerator(this.parent);
    }
    renderTable() {
        super.renderTable();
        this.getFrozenContent().appendChild(this.getTable());
        let mTbl = this.getTable().cloneNode(true);
        this.getMovableContent().appendChild(mTbl);
        remove(this.getMovableContent().querySelector('colgroup'));
        let colGroup = ((this.parent.getHeaderContent().querySelector('.e-movableheader').querySelector('colgroup')).cloneNode(true));
        mTbl.insertBefore(colGroup, mTbl.querySelector('tbody'));
    }
}
class FreezeRender extends HeaderRender {
    constructor(parent, locator) {
        super(parent, locator);
        this.addEventListener();
    }
    addEventListener() {
        this.parent.on(freezeRender, this.refreshFreeze, this);
    }
    renderTable() {
        super.renderTable();
        this.rfshMovable();
        this.updateColgroup();
        this.initializeHeaderDrag();
        this.initializeHeaderDrop();
        this.parent.notify(headerRefreshed, { rows: this.rows, args: { isFrozen: false } });
    }
    renderPanel() {
        super.renderPanel();
        let fDiv = createElement('div', { className: 'e-frozenheader' });
        let mDiv = createElement('div', { className: 'e-movableheader' });
        this.getPanel().firstChild.appendChild(fDiv);
        this.getPanel().firstChild.appendChild(mDiv);
        this.setFrozenHeader(fDiv);
        this.setMovableHeader(mDiv);
    }
    refreshUI() {
        let tbody = this.getMovableHeader().querySelector('tbody');
        remove(this.getMovableHeader().querySelector('table'));
        super.refreshUI();
        this.rfshMovable();
        this.getMovableHeader().querySelector('tbody').innerHTML = tbody.innerHTML;
        this.updateColgroup();
        renderMovable(this.parent.getContentTable().querySelector('colgroup'), this.parent.getFrozenColumns());
        this.initializeHeaderDrag();
        this.parent.notify(headerRefreshed, { rows: this.rows, args: { isFrozen: false } });
    }
    rfshMovable() {
        this.getFrozenHeader().appendChild(this.getTable());
        this.getMovableHeader().appendChild(this.createTable());
        this.refreshStackedHdrHgt();
    }
    refreshFreeze(obj) {
        if (obj.case === 'filter') {
            let filterRow = this.getTable().querySelector('.e-filterbar');
            if (this.parent.allowFiltering && filterRow && this.getMovableHeader().querySelector('thead')) {
                this.getMovableHeader().querySelector('thead')
                    .appendChild(renderMovable(filterRow, this.parent.getFrozenColumns()));
            }
        }
        else if (obj.case === 'textwrap') {
            let fRows;
            let mRows;
            let fHdr = this.getFrozenHeader();
            let mHdr = this.getMovableHeader();
            let cont = this.parent.getContent();
            let wrapMode = this.parent.textWrapSettings.wrapMode;
            let hdrClassList = this.parent.getHeaderContent().firstChild.classList;
            if (wrapMode !== 'Header' || obj.isModeChg) {
                fRows = cont.querySelector('.e-frozencontent').querySelectorAll('tr');
                mRows = cont.querySelector('.e-movablecontent').querySelectorAll('tr');
                this.setWrapHeight(fRows, mRows, obj.isModeChg, true);
            }
            if (wrapMode === 'Content' && this.parent.allowTextWrap) {
                hdrClassList.add('e-wrap');
            }
            else {
                hdrClassList.remove('e-wrap');
            }
            if (wrapMode === 'Both' || obj.isModeChg) {
                fRows = fHdr.querySelectorAll('tr');
                mRows = mHdr.querySelectorAll('tr');
            }
            else {
                fRows = fHdr.querySelector(wrapMode === 'Content' ? 'tbody' : 'thead').querySelectorAll('tr');
                mRows = mHdr.querySelector(wrapMode === 'Content' ? 'tbody' : 'thead').querySelectorAll('tr');
            }
            this.setWrapHeight(fRows, mRows, obj.isModeChg, false, this.colDepth > 1);
            this.refreshStackedHdrHgt();
        }
    }
    updateResizeHandler() {
        [].slice.call(this.parent.getHeaderContent().querySelectorAll('.e-rhandler')).forEach((ele) => {
            ele.style.height = ele.parentElement.offsetHeight + 'px';
        });
    }
    setWrapHeight(fRows, mRows, isModeChg, isContReset, isStackedHdr) {
        let fRowHgt;
        let mRowHgt;
        let isWrap = this.parent.allowTextWrap;
        let wrapMode = this.parent.textWrapSettings.wrapMode;
        let tHead = this.parent.getHeaderContent().querySelector('thead');
        let tBody = this.parent.getHeaderContent().querySelector('tbody');
        for (let i = 0, len = fRows.length; i < len; i++) {
            if (isModeChg && ((wrapMode === 'Header' && isContReset) || ((wrapMode === 'Content' && tHead.contains(fRows[i]))
                || (wrapMode === 'Header' && tBody.contains(fRows[i])))) || isStackedHdr) {
                fRows[i].style.height = null;
                mRows[i].style.height = null;
            }
            fRowHgt = fRows[i].offsetHeight;
            mRowHgt = mRows[i].offsetHeight;
            if (fRows[i].childElementCount && ((isWrap && fRowHgt < mRowHgt) || (!isWrap && fRowHgt > mRowHgt))) {
                fRows[i].style.height = mRowHgt + 'px';
            }
            else if (mRows[i].childElementCount && ((isWrap && fRowHgt > mRowHgt) || (!isWrap && fRowHgt < mRowHgt))) {
                mRows[i].style.height = fRowHgt + 'px';
            }
        }
    }
    refreshStackedHdrHgt() {
        let fRowSpan;
        let mRowSpan;
        let fTr = this.getFrozenHeader().querySelectorAll('.e-columnheader');
        let mTr = this.getMovableHeader().querySelectorAll('.e-columnheader');
        for (let i = 0, len = fTr.length; i < len; i++) {
            fRowSpan = this.getRowSpan(fTr[i]);
            mRowSpan = this.getRowSpan(mTr[i]);
            if (fRowSpan.min > 1) {
                this.updateStackedHdrRowHgt(i, fRowSpan.max, fTr[i], mTr);
            }
            else if (mRowSpan.min > 1) {
                this.updateStackedHdrRowHgt(i, mRowSpan.max, mTr[i], fTr);
            }
        }
        if (this.parent.allowResizing) {
            this.updateResizeHandler();
        }
    }
    getRowSpan(row) {
        let rSpan;
        let minRowSpan;
        let maxRowSpan;
        for (let i = 0, len = row.childElementCount; i < len; i++) {
            if (i === 0) {
                minRowSpan = row.children[0].rowSpan;
            }
            rSpan = row.children[i].rowSpan;
            minRowSpan = Math.min(rSpan, minRowSpan);
            maxRowSpan = Math.max(rSpan, minRowSpan);
        }
        return { min: minRowSpan, max: maxRowSpan };
    }
    updateStackedHdrRowHgt(idx, maxRowSpan, row, rows) {
        let height = 0;
        for (let i = 0; i < maxRowSpan; i++) {
            height += rows[idx + i].offsetHeight;
        }
        row.style.height = height + 'px';
    }
    setFrozenHeader(ele) {
        this.frozenHeader = ele;
    }
    setMovableHeader(ele) {
        this.movableHeader = ele;
    }
    getFrozenHeader() {
        return this.frozenHeader;
    }
    getMovableHeader() {
        return this.movableHeader;
    }
    updateColgroup() {
        let mTable = this.getMovableHeader().querySelector('table');
        remove(this.getMovableHeader().querySelector('colgroup'));
        mTable.insertBefore(renderMovable(this.getFrozenHeader().querySelector('colgroup'), this.parent.getFrozenColumns()), mTable.querySelector('thead'));
    }
}

/**
 * `Freeze` module is used to handle Frozen rows and columns.
 * @hidden
 */
class Freeze {
    constructor(parent, locator) {
        this.parent = parent;
        this.locator = locator;
        this.addEventListener();
    }
    getModuleName() {
        return 'freeze';
    }
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initialLoad, this.instantiateRenderer, this);
        this.parent.on(initialEnd, this.wireEvents, this);
    }
    wireEvents() {
        if (this.parent.frozenRows) {
            EventHandler.add(this.parent.getHeaderContent(), 'dblclick', this.dblClickHandler, this);
        }
    }
    dblClickHandler(e) {
        if (parentsUntil(e.target, 'e-grid').id !== this.parent.element.id) {
            return;
        }
        this.parent.notify(dblclick, e);
    }
    instantiateRenderer() {
        let renderer = this.locator.getService('rendererFactory');
        if (this.parent.getFrozenColumns()) {
            renderer.addRenderer(RenderType.Header, new FreezeRender(this.parent, this.locator));
            renderer.addRenderer(RenderType.Content, new FreezeContentRender(this.parent, this.locator));
        }
    }
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initialLoad, this.instantiateRenderer);
    }
    destroy() {
        this.removeEventListener();
    }
}

/**
 * 'column menu module used to handle column menu actions'
 */
class ColumnMenu {
    constructor(parent, serviceLocator) {
        this.defaultItems = {};
        this.localeText = this.setLocaleKey();
        this.disableItems = [];
        this.hiddenItems = [];
        this.isOpen = false;
        // default class names
        this.GROUP = 'e-icon-group';
        this.UNGROUP = 'e-icon-ungroup';
        this.ASCENDING = 'e-icon-ascending';
        this.DESCENDING = 'e-icon-descending';
        this.ROOT = 'e-columnmenu';
        this.FILTER = 'e-icon-filter';
        this.POP = 'e-filter-popup';
        this.WRAP = 'e-col-menu';
        this.CHOOSER = '_chooser_';
        this.parent = parent;
        this.gridID = parent.element.id;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    wireEvents() {
        this.getColumnMenuHandlers().forEach((ele) => {
            EventHandler.add(ele, 'mousedown', this.columnMenuHandlerDown, this);
        });
    }
    unwireEvents() {
        this.getColumnMenuHandlers().forEach((ele) => {
            EventHandler.remove(ele, 'mousedown', this.columnMenuHandlerDown);
        });
    }
    /**
     * To destroy the resize
     * @return {void}
     * @hidden
     */
    destroy() {
        this.columnMenu.destroy();
        this.removeEventListener();
        this.unwireFilterEvents();
        this.unwireEvents();
        remove(this.element);
    }
    columnMenuHandlerClick(e) {
        if (e.target.classList.contains('e-columnmenu')) {
            if ((this.isOpen && this.headerCell !== this.getHeaderCell(e)) || document.querySelector('.e-grid-menu .e-menu-parent.e-ul')) {
                this.columnMenu.close();
                this.openColumnMenu(e);
            }
            else if (!this.isOpen) {
                this.openColumnMenu(e);
            }
            else {
                this.columnMenu.close();
            }
        }
    }
    openColumnMenu(e) {
        let pos = { top: 0, left: 0 };
        this.element.style.cssText = 'display:block;visibility:hidden';
        let elePos = this.element.getBoundingClientRect();
        this.element.style.cssText = 'display:none;visibility:visible';
        this.headerCell = this.getHeaderCell(e);
        if (Browser.isDevice) {
            pos.top = ((window.innerHeight / 2) - (elePos.height / 2));
            pos.left = ((window.innerWidth / 2) - (elePos.width / 2));
        }
        else {
            if (this.parent.enableRtl) {
                pos = calculatePosition(this.headerCell, 'left', 'bottom');
            }
            else {
                pos = calculatePosition(this.headerCell, 'right', 'bottom');
                pos.left -= elePos.width;
            }
        }
        this.columnMenu.open(pos.top, pos.left);
        e.preventDefault();
    }
    columnMenuHandlerDown(e) {
        this.isOpen = !(this.element.style.display === 'none' || this.element.style.display === '');
    }
    getColumnMenuHandlers() {
        return [].slice.call(this.parent.getHeaderTable().querySelectorAll('.' + this.ROOT));
    }
    /**
     * @hidden
     */
    addEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(headerRefreshed, this.wireEvents, this);
        this.parent.on(uiUpdate, this.enableAfterRenderMenu, this);
        this.parent.on(initialEnd, this.render, this);
        if (this.isFilterItemAdded()) {
            this.parent.on(filterDialogCreated, this.filterPosition, this);
        }
        this.parent.on(click, this.columnMenuHandlerClick, this);
    }
    /**
     * @hidden
     */
    removeEventListener() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(headerRefreshed, this.unwireEvents);
        this.parent.off(uiUpdate, this.enableAfterRenderMenu);
        this.parent.off(initialEnd, this.render);
        if (this.isFilterItemAdded()) {
            this.parent.off(filterDialogCreated, this.filterPosition);
        }
        this.parent.off(click, this.columnMenuHandlerClick);
    }
    enableAfterRenderMenu(e) {
        if (e.module === this.getModuleName() && e.enable) {
            if (this.columnMenu) {
                this.columnMenu.destroy();
                remove(this.element);
            }
            this.render();
        }
    }
    render() {
        this.l10n = this.serviceLocator.getService('localization');
        this.element = createElement('ul', { id: this.gridID + '_columnmenu', className: 'e-colmenu' });
        this.parent.element.appendChild(this.element);
        this.columnMenu = new ContextMenu({
            cssClass: 'e-grid-menu',
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            locale: this.parent.locale,
            items: this.getItems(),
            select: this.columnMenuItemClick.bind(this),
            beforeOpen: this.columnMenuBeforeOpen.bind(this),
            onClose: this.columnMenuOnClose.bind(this),
            beforeItemRender: this.beforeMenuItemRender.bind(this),
            beforeClose: this.columnMenuBeforeClose.bind(this)
        });
        this.columnMenu.appendTo(this.element);
        this.wireFilterEvents();
    }
    wireFilterEvents() {
        if (!Browser.isDevice && this.isFilterItemAdded()) {
            EventHandler.add(this.element, 'mouseover', this.appendFilter, this);
        }
    }
    unwireFilterEvents() {
        if (!Browser.isDevice && this.isFilterItemAdded()) {
            EventHandler.remove(this.element, 'mouseover', this.appendFilter);
        }
    }
    beforeMenuItemRender(args) {
        if (this.isChooserItem(args.item)) {
            let field = this.getKeyFromId(args.item.id, this.CHOOSER);
            let column = this.parent.getColumnByField(field);
            let check = createCheckBox(false, {
                label: args.item.text,
                checked: column.visible
            });
            if (this.parent.enableRtl) {
                check.classList.add('e-rtl');
            }
            args.element.innerHTML = '';
            args.element.appendChild(check);
        }
        else if (args.item.id && this.getKeyFromId(args.item.id) === 'Filter') {
            args.element.appendChild(createElement('span', { className: 'e-icons e-caret' }));
            args.element.className += 'e-filter-item e-menu-caret-icon';
        }
    }
    columnMenuBeforeClose(args) {
        let colChooser = args.event ? closest(args.event.target, '.e-menu-item') : null;
        if (!isNullOrUndefined(args.parentItem) &&
            this.getKeyFromId(args.parentItem.id) === 'ColumnChooser' &&
            colChooser && this.isChooserItem(colChooser)) {
            args.cancel = true;
        }
        else if (args.event && (closest(args.event.target, '.' + this.POP)
            || parentsUntil(args.event.target, 'e-popup') ||
            (parentsUntil(args.event.target, 'e-popup-wrapper')))) {
            args.cancel = true;
        }
    }
    isChooserItem(item) {
        return item.id && item.id.indexOf('_colmenu_') >= 0 &&
            this.getKeyFromId(item.id, this.CHOOSER).indexOf('_colmenu_') === -1;
    }
    columnMenuBeforeOpen(args) {
        args.column = this.targetColumn = this.getColumn();
        this.parent.trigger(columnMenuOpen, args);
        for (let item of args.items) {
            let key = this.getKeyFromId(item.id);
            let dItem = this.defaultItems[key];
            if (this.getDefaultItems().indexOf(key) !== -1) {
                if (this.ensureDisabledStatus(key) && !dItem.hide) {
                    this.disableItems.push(item.text);
                }
                else if (item.hide) {
                    this.hiddenItems.push(item.text);
                }
            }
        }
        this.columnMenu.enableItems(this.disableItems, false);
        this.columnMenu.hideItems(this.hiddenItems);
    }
    ensureDisabledStatus(item) {
        let status = false;
        switch (item) {
            case 'Group':
                if (!this.parent.allowGrouping || (this.parent.ensureModuleInjected(Group) && this.targetColumn
                    && this.parent.groupSettings.columns.indexOf(this.targetColumn.field) >= 0)) {
                    status = true;
                }
                break;
            case 'AutoFitAll':
            case 'AutoFit':
                status = !this.parent.ensureModuleInjected(Resize);
                break;
            case 'Ungroup':
                if (!this.parent.ensureModuleInjected(Group) || (this.parent.ensureModuleInjected(Group) && this.targetColumn
                    && this.parent.groupSettings.columns.indexOf(this.targetColumn.field) < 0)) {
                    status = true;
                }
                break;
            case 'SortDescending':
            case 'SortAscending':
                if (this.parent.allowSorting && this.parent.ensureModuleInjected(Sort)
                    && this.parent.sortSettings.columns.length > 0 && this.targetColumn) {
                    this.parent.sortSettings.columns.forEach((ele) => {
                        if (ele.field === this.targetColumn.field
                            && ele.direction.toLocaleLowerCase() === item.toLocaleLowerCase().replace('sort', '')) {
                            status = true;
                        }
                    });
                }
                else if (!this.parent.allowSorting || !this.parent.ensureModuleInjected(Sort)) {
                    status = true;
                }
                break;
            case 'Filter':
                status = !(this.parent.allowFiltering && (this.parent.filterSettings.type !== 'FilterBar')
                    && this.parent.ensureModuleInjected(Filter));
        }
        return status;
    }
    columnMenuItemClick(args) {
        let item = this.isChooserItem(args.item) ? 'ColumnChooser' : this.getKeyFromId(args.item.id);
        switch (item) {
            case 'AutoFit':
                this.parent.autoFitColumns(this.targetColumn.field);
                break;
            case 'AutoFitAll':
                this.parent.autoFitColumns([]);
                break;
            case 'Ungroup':
                this.parent.ungroupColumn(this.targetColumn.field);
                break;
            case 'Group':
                this.parent.groupColumn(this.targetColumn.field);
                break;
            case 'SortAscending':
                this.parent.sortColumn(this.targetColumn.field, 'Ascending');
                break;
            case 'SortDescending':
                this.parent.sortColumn(this.targetColumn.field, 'Descending');
                break;
            case 'ColumnChooser':
                let key = this.getKeyFromId(args.item.id, this.CHOOSER);
                let checkbox = args.element.querySelector('.e-checkbox-wrapper .e-frame');
                if (checkbox && checkbox.classList.contains('e-check')) {
                    checkbox.classList.remove('e-check');
                    this.parent.hideColumns(key, 'field');
                }
                else if (checkbox) {
                    this.parent.showColumns(key, 'field');
                    checkbox.classList.add('e-check');
                }
                break;
            case 'Filter':
                this.getFilter(args.element, args.item.id);
                break;
        }
        args.column = this.targetColumn;
        this.parent.trigger(columnMenuClick, args);
    }
    columnMenuOnClose(args) {
        let parent = 'parentObj';
        if (args.items.length > 0 && args.items[0][parent] instanceof ContextMenu) {
            this.columnMenu.enableItems(this.disableItems);
            this.disableItems = [];
            this.columnMenu.showItems(this.hiddenItems);
            this.hiddenItems = [];
            if (this.isFilterPopupOpen()) {
                this.getFilter(args.element, args.element.id, true);
            }
        }
    }
    getDefaultItems() {
        return ['AutoFitAll', 'AutoFit', 'SortAscending', 'SortDescending', 'Group', 'Ungroup', 'ColumnChooser', 'Filter'];
    }
    getItems() {
        let items = [];
        let defultItems = this.parent.columnMenuItems ? this.parent.columnMenuItems : this.getDefault();
        for (let item of defultItems) {
            if (typeof item === 'string') {
                if (item === 'ColumnChooser') {
                    let col = this.getDefaultItem(item);
                    col.items = this.createChooserItems();
                    items.push(col);
                }
                else {
                    items.push(this.getDefaultItem(item));
                }
            }
            else {
                items.push(item);
            }
        }
        return items;
    }
    getDefaultItem(item) {
        let menuItem = {};
        switch (item) {
            case 'SortAscending':
                menuItem = { iconCss: this.ASCENDING };
                break;
            case 'SortDescending':
                menuItem = { iconCss: this.DESCENDING };
                break;
            case 'Group':
                menuItem = { iconCss: this.GROUP };
                break;
            case 'Ungroup':
                menuItem = { iconCss: this.UNGROUP };
                break;
            case 'Filter':
                menuItem = { iconCss: this.FILTER };
                break;
        }
        this.defaultItems[item] = {
            text: this.getLocaleText(item), id: this.generateID(item),
            iconCss: menuItem.iconCss ? 'e-icons ' + menuItem.iconCss : null
        };
        return this.defaultItems[item];
    }
    getLocaleText(item) {
        return this.l10n.getConstant(this.localeText[item]);
    }
    generateID(item, append$$1) {
        return this.gridID + '_colmenu_' + (append$$1 ? append$$1 + item : item);
    }
    getKeyFromId(id, append$$1) {
        return id.indexOf('_colmenu_') > 0 &&
            id.replace(this.gridID + '_colmenu_' + (append$$1 ? append$$1 : ''), '');
    }
    getColumnMenu() {
        return this.element;
    }
    getModuleName() {
        return 'columnMenu';
    }
    setLocaleKey() {
        return {
            'AutoFitAll': 'autoFitAll',
            'AutoFit': 'autoFit',
            'Group': 'Group',
            'Ungroup': 'Ungroup',
            'SortAscending': 'SortAscending',
            'SortDescending': 'SortDescending',
            'ColumnChooser': 'Columnchooser',
            'Filter': 'FilterMenu'
        };
    }
    getHeaderCell(e) {
        return closest(e.target, 'th.e-headercell');
    }
    getColumn() {
        if (this.headerCell) {
            let uid = this.headerCell.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
            return this.parent.getColumnByUid(uid);
        }
        return null;
    }
    createChooserItems() {
        let items = [];
        for (let col of this.parent.getColumns()) {
            if (col.showInColumnChooser && col.field) {
                items.push({ id: this.generateID(col.field, this.CHOOSER), text: col.headerText ? col.headerText : col.field });
            }
        }
        return items;
    }
    appendFilter(e) {
        let filter = 'Filter';
        if (!this.defaultItems[filter]) {
            return;
        }
        else {
            let key = this.defaultItems[filter].id;
            if (closest(e.target, '#' + key) && !this.isFilterPopupOpen()) {
                this.getFilter(e.target, key);
            }
            else if (!closest(e.target, '#' + key) && this.isFilterPopupOpen()) {
                this.getFilter(e.target, key, true);
            }
        }
    }
    getFilter(target, id, isClose) {
        let filterPopup = this.getFilterPop();
        if (filterPopup) {
            filterPopup.style.display = !Browser.isDevice && isClose ? 'none' : 'block';
        }
        else {
            this.parent.notify(filterOpen, {
                col: this.targetColumn, target: target, isClose: isClose, id: id
            });
        }
    }
    setPosition(li, ul) {
        let gridPos = this.parent.element.getBoundingClientRect();
        let liPos = li.getBoundingClientRect();
        let left = liPos.left - gridPos.left;
        let top = liPos.top - gridPos.top;
        if (gridPos.height < top) {
            top = top - ul.offsetHeight + liPos.height;
        }
        else if (gridPos.height < top + ul.offsetHeight) {
            top = gridPos.height - ul.offsetHeight;
        }
        if (window.innerHeight < ul.offsetHeight + top + gridPos.top) {
            top = window.innerHeight - ul.offsetHeight - gridPos.top;
        }
        left += (this.parent.enableRtl ? -ul.offsetWidth : liPos.width);
        if (gridPos.width <= left + ul.offsetWidth) {
            left -= liPos.width + ul.offsetWidth;
        }
        else if (left < 0) {
            left += ul.offsetWidth + liPos.width;
        }
        ul.style.top = top + 'px';
        ul.style.left = left + 'px';
    }
    filterPosition(e) {
        let filterPopup = this.getFilterPop();
        filterPopup.classList.add(this.WRAP);
        if (!Browser.isDevice) {
            let disp = filterPopup.style.display;
            filterPopup.style.cssText += 'display:block;visibility:hidden';
            let li = this.element.querySelector('.' + this.FILTER);
            if (li) {
                this.setPosition(li.parentElement, filterPopup);
                filterPopup.style.cssText += 'display:' + disp + ';visibility:visible';
            }
        }
    }
    getDefault() {
        let items = [];
        if (this.parent.ensureModuleInjected(Resize)) {
            items.push('AutoFitAll');
            items.push('AutoFit');
        }
        if (this.parent.allowGrouping && this.parent.ensureModuleInjected(Group)) {
            items.push('Group');
            items.push('Ungroup');
        }
        if (this.parent.allowSorting && this.parent.ensureModuleInjected(Sort)) {
            items.push('SortAscending');
            items.push('SortDescending');
        }
        items.push('ColumnChooser');
        if (this.parent.allowFiltering && (this.parent.filterSettings.type !== 'FilterBar') &&
            this.parent.ensureModuleInjected(Filter)) {
            items.push('Filter');
        }
        return items;
    }
    isFilterPopupOpen() {
        let filterPopup = this.getFilterPop();
        return filterPopup && filterPopup.style.display !== 'none';
    }
    getFilterPop() {
        return this.parent.element.querySelector('.' + this.POP);
    }
    isFilterItemAdded() {
        return (this.parent.columnMenuItems &&
            this.parent.columnMenuItems.indexOf('Filter') >= 0) || !this.parent.columnMenuItems;
    }
}

/**
 * `ForeignKey` module is used to handle foreign key column's actions.
 */
class ForeignKey extends Data {
    constructor(parent, serviceLocator) {
        super(parent, serviceLocator);
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.initEvent();
    }
    initEvent() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(initForeignKeyColumn, this.initForeignKeyColumns, this);
        this.parent.on(getForeignKeyData, this.getForeignKeyData, this);
        this.parent.on(generateQuery, this.generateQueryFormData, this);
    }
    initForeignKeyColumns(columns) {
        columns.forEach((column) => {
            column.dataSource = (column.dataSource instanceof DataManager ? column.dataSource :
                (isNullOrUndefined(column.dataSource) ? new DataManager() : new DataManager(column.dataSource)));
        });
    }
    getForeignKeyData(args) {
        let foreignColumns = args.column ? [args.column] : this.parent.getForeignKeyColumns();
        let allPromise = [];
        foreignColumns.forEach((col) => {
            let promise;
            let query = args.isComplex ? this.genarateColumnQuery(col) :
                this.genarateQuery(col, args.result.result, false, true);
            let dataSource = col.dataSource;
            if (!dataSource.ready || dataSource.dataSource.offline) {
                promise = dataSource.executeQuery(query);
            }
            else {
                promise = dataSource.ready.then(() => {
                    return dataSource.executeQuery(query);
                });
            }
            allPromise.push(promise);
        });
        Promise.all(allPromise).then((responses) => {
            responses.forEach((data, index) => {
                foreignColumns[index].columnData = data.result;
            });
            args.promise.resolve(args.result);
        }).catch((e) => {
            if (args.promise && args.promise.reject) {
                args.promise.reject(e);
            }
            return e;
        });
    }
    generateQueryFormData(args) {
        args.predicate.predicate = this.genarateQuery(args.column, args.column.columnData, true);
    }
    genarateQuery(column, e, fromData, needQuery) {
        let gObj = this.parent;
        let predicates = [];
        let predicate;
        let query = new Query();
        if (gObj.allowPaging || gObj.enableVirtualization || fromData) {
            e = new DataManager(((gObj.allowGrouping && gObj.groupSettings.columns.length) ?
                e.records : e)).executeLocal(new Query().select(column.field));
            let filteredValue = DataUtil.distinct(e, column.field, false);
            filteredValue.forEach((obj) => {
                if (obj.getDay) {
                    predicates.push(getDatePredicate({ field: column.field, operator: 'equal', value: obj, matchCase: false }));
                }
                else {
                    predicates.push(new Predicate(column.field, 'equal', obj, false));
                }
            });
        }
        if (needQuery) {
            return predicates.length ? query.where(Predicate.or(predicates)) : query;
        }
        predicate = (predicates.length ? Predicate.or(predicates) : { predicates: [] });
        return predicate;
    }
    genarateColumnQuery(column) {
        let gObj = this.parent;
        let query = gObj.query.clone();
        let queryColumn = this.isFiltered(column);
        if (queryColumn.isTrue) {
            query = this.filterQuery(query, queryColumn.column, true);
        }
        if (gObj.searchSettings.key.length) {
            let sSettings = gObj.searchSettings;
            query.search(sSettings.key, column.foreignKeyValue, sSettings.operator, sSettings.ignoreCase);
        }
        return query;
    }
    isFiltered(column) {
        let filterColumn = this.parent.filterSettings.columns.filter((fColumn) => {
            return (fColumn.field === column.foreignKeyValue);
        });
        return {
            column: filterColumn, isTrue: !!filterColumn.length
        };
    }
    getModuleName() {
        return 'foreignKey';
    }
    destroy() {
        super.destroy();
        this.destroyEvent();
    }
    destroyEvent() {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(initForeignKeyColumn, this.initForeignKeyColumns);
        this.parent.off(getForeignKeyData, this.getForeignKeyData);
        this.parent.off(generateQuery, this.generateQueryFormData);
    }
}

/**
 * Action export
 */

/**
 * Models
 */

/**
 * Models
 */

/**
 * Services
 */

/**
 * Grid component exported items
 */

/**
 * Pager component exported items
 */

/**
 * Export Grid components
 */

export { SortDescriptor, SortSettings, Predicate$1 as Predicate, FilterSettings, SelectionSettings, SearchSettings, RowDropSettings, TextWrapSettings, GroupSettings, EditSettings, Grid, CellType, RenderType, ToolbarItem, doesImplementInterface, valueAccessor, getUpdateUsingRaf, iterateArrayOrObject, templateCompiler, setStyleAndAttributes, extend$1 as extend, prepareColumns, setCssInGridPopUp, getActualProperties, parentsUntil, getElementIndex, inArray, getActualPropFromColl, removeElement, getPosition, getUid, appendChildren, parents, calculateAggregate, getScrollBarWidth, getRowHeight, isEditable, isActionPrevent, wrap, changeButtonType, setFormatter, addRemoveActiveClasses, distinctStringValues, getFilterMenuPostion, getZIndexCalcualtion, toogleCheckbox, createCboxWithWrap, removeAddCboxClasses, refreshForeignData, getForeignData, getColumnByForeignKeyValue, getDatePredicate, renderMovable, created, destroyed, load, rowDataBound, queryCellInfo, actionBegin, actionComplete, actionFailure, dataBound, rowSelecting, rowSelected, rowDeselecting, rowDeselected, cellSelecting, cellSelected, cellDeselecting, cellDeselected, columnDragStart, columnDrag, columnDrop, rowDragStart, rowDrag, rowDrop, beforePrint, printComplete, detailDataBound, toolbarClick, batchAdd, batchCancel, batchDelete, beforeBatchAdd, beforeBatchDelete, beforeBatchSave, beginEdit, cellEdit, cellSave, endAdd, endDelete, endEdit, recordDoubleClick, recordClick, beforeDataBound, beforeOpenColumnChooser, resizeStart, onResize, resizeStop, checkBoxChange, beforeCopy, filterChoiceRequest, filterAfterOpen, filterBeforeOpen, initialLoad, initialEnd, dataReady, contentReady, uiUpdate, onEmpty, inBoundModelChanged, modelChanged, colGroupRefresh, headerRefreshed, pageBegin, pageComplete, sortBegin, sortComplete, filterBegin, filterComplete, searchBegin, searchComplete, reorderBegin, reorderComplete, rowDragAndDropBegin, rowDragAndDropComplete, groupBegin, groupComplete, ungroupBegin, ungroupComplete, rowSelectionBegin, rowSelectionComplete, columnSelectionBegin, columnSelectionComplete, cellSelectionBegin, cellSelectionComplete, beforeCellFocused, cellFocused, keyPressed, click, destroy, columnVisibilityChanged, scroll, columnWidthChanged, columnPositionChanged, rowDragAndDrop, rowsAdded, rowsRemoved, columnDragStop, headerDrop, dataSourceModified, refreshComplete, refreshVirtualBlock, dblclick, toolbarRefresh, bulkSave, autoCol, tooltipDestroy, updateData, editBegin, editComplete, addBegin, addComplete, saveComplete, deleteBegin, deleteComplete, preventBatch, dialogDestroy, crudAction, addDeleteAction, destroyForm, doubleTap, beforeExcelExport, excelExportComplete, excelQueryCellInfo, beforePdfExport, pdfExportComplete, pdfQueryCellInfo, accessPredicate, contextMenuClick, freezeRender, freezeRefresh, contextMenuOpen, columnMenuClick, columnMenuOpen, filterOpen, filterDialogCreated, filterMenuClose, initForeignKeyColumn, getForeignKeyData, generateQuery, showEmptyGrid, foreignKeyData, dataStateChange, dataSourceChanged, rtlUpdated, Data, Sort, Page, Selection, Filter, Search, Scroll, resizeClassList, Resize, Reorder, RowDD, Group, Print, DetailRow, Toolbar$1 as Toolbar, Aggregate, summaryIterator, VirtualScroll, Edit, Global, BatchEdit, InlineEdit, NormalEdit, DialogEdit, ColumnChooser, ExcelExport, PdfExport, ExportHelper, ExportValueFormatter, Clipboard, CommandColumn, CheckBoxFilter, menuClass, ContextMenu$1 as ContextMenu, Freeze, ColumnMenu, ExcelFilter, ForeignKey, Column, HeaderRender, ContentRender, RowRenderer, CellRenderer, HeaderCellRenderer, FilterCellRenderer, StackedHeaderCellRenderer, Render, IndentCellRenderer, GroupCaptionCellRenderer, GroupCaptionEmptyCellRenderer, BatchEditRender, DialogEditRender, InlineEditRender, EditRender, BooleanEditCell, DefaultEditCell, DropDownEditCell, NumericEditCell, DatePickerEditCell, CommandColumnRenderer, FreezeContentRender, FreezeRender, StringFilterUI, NumberFilterUI, DateFilterUI, BooleanFilterUI, FlMenuOptrUI, CellRendererFactory, ServiceLocator, RowModelGenerator, GroupModelGenerator, FreezeRowModelGenerator, Pager, ExternalMessage, NumericContainer, PagerMessage };
//# sourceMappingURL=ej2-grids.es2015.js.map
