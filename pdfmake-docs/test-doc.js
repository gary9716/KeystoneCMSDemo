module.exports = function(req, res) {

  //provide input through bind
  var data = res.locals;
  res.locals.filename = 'test-doc.pdf';

  return {
    //pdf metas
    /*
    //available options
    title - the title of the document
    author - the name of the author
    subject - the subject of the document
    keywords - keywords associated with the document
    creator - the creator of the document (default is 'pdfmake')
    producer - the producer of the document (default is 'pdfmake')
    creationDate - the date the document was created (added automatically by pdfmake)
    modDate - the date the document was last modified
    trapped - the trapped flag in a PDF document indicates whether the document has been "trapped"
    */
    info: {
      title: 'awesome Document',
      author: 'kt chou',
      subject: 'subject of document',
      keywords: 'keywords for document',
    },

    //compress: false, enable by default

    /*
    //page size candidates:
    '4A0', '2A0', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
    'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10',
    'RA0', 'RA1', 'RA2', 'RA3', 'RA4',
    'SRA0', 'SRA1', 'SRA2', 'SRA3', 'SRA4',
    'EXECUTIVE', 'FOLIO', 'LEGAL', 'LETTER', 'TABLOID'
    */

    // a string or { width: number, height: number }
    pageSize: 'A4',

    // by default we use portrait, you can change it to landscape if you wish
    pageOrientation: 'portrait',

    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
    pageMargins: [ 40, 60, 40, 60 ],
    
    header: 'header text',
    
    footer: {
      columns: [
        'footer left',
        { text: 'footer right', alignment: 'right' }
      ]
    },

    defaultStyle: {
      font: 'msjh'
    },

    styles: {
      header: {
        fontSize: 22,
        bold: true
      },
      anotherStyle: {
        italics: true,
        alignment: 'right'
      },
    },

    images: {
      'rice_image': __base + 'public/images/test-rice2.jpg'
    },

    /*
    //use function to dynamically generate content
    footer: function(currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; },
    header: function(currentPage, pageCount, pageSize) {
      // you can apply any logic and return any valid pdfmake element

      return [
        { text: 'simple text', alignment: (currentPage % 2) ? 'left' : 'right' },
        { canvas: [ { type: 'rect', x: 170, y: 32, w: pageSize.width - 170, h: 40 } ] }
      ]
    },
    background: function(currentPage) {
      return 'simple text on page ' + currentPage
    },
    */

    content: [
      
      // if you don't need styles, you can use a simple string to define a paragraph
      'This is a standard paragraph, using default style',

      { text: '中文字型測試，你說那是啥'},

      { text: '明體', font: 'ming' },

      { text: '中文字型測試, 楷體', font: 'kai', decoration: 'lineThrough'},
      
      { text: '黑體粗,大小20,標底線', bold: true, fontSize:20, decoration: 'underline' },

      // using a { text: '...' } object lets you set styling properties
      { text: 'This paragraph will have a bigger font', fontSize: 15 },

      // margin: [left, top, right, bottom]
      { text: 'demo with margin', margin: [ 5, 2, 10, 20 ]},
      
      // margin: [horizontal, vertical]
      { text: 'another text', margin: [5, 2] },

      {text: 'Underline decoration', decoration: 'underline'},
      {text: 'Dashed style', decoration: 'underline', decorationStyle: 'dashed'},
      {text: 'Dotted style', decoration: 'underline', decorationStyle: 'dotted'},
      {text: 'Double style', decoration: 'underline', decorationStyle: 'double'},
      {text: 'Wavy style', decoration: 'underline', decorationStyle: 'wavy'},
      {text: 'Line Through decoration', decoration: 'lineThrough'},
      {text: 'Overline decoration', decoration: 'overline'},

      // if you set the value of text to an array instead of a string, you'll be able
      // to style any part individually
      {
        text: [
          'This paragraph is defined as an array of elements to make it possible to ',
          { text: 'restyle part of it and make it bigger ', fontSize: 15 },
          'than the rest.'
        ]
      },

      {
        text: 'test text using style. for ex: this is header style',
        style: 'header'
      },

      'some text between',

      {
        //columns demo
        columns: [
        {
          // auto-sized columns have their widths based on their content
          width: 'auto',
          text: 'First column'
        },
        {
          // star-sized columns fill the remaining space
          // if there's more than one star-column, available width is divided equally
          width: '*',
          text: 'Second column'
        },
        {
          // fixed width
          width: 100,
          text: 'Third column'
        },
        {
          // % width
          width: '20%',
          text: 'Fourth column'
        }
        ],
        // optional space between columns
        columnGap: 10

      },

      {
        columns: [
          'first column is a simple text',
          {
            stack: [
              // second column consists of paragraphs
              'paragraph A',
              'paragraph B',
              'these paragraphs will be rendered one below another inside the column'
            ],
            fontSize: 15
          }
        ]
      },

      {
        //table demo
        layout: 'lightHorizontalLines', // optional
        table: {
          // headers are automatically repeated if the table spans over multiple pages
          // you can declare how many rows should be treated as headers
          headerRows: 1,
          widths: [ '*', 'auto', 100, '*' ],

          body: [
            [ 'First', 'Second', 'Third', 'The last one' ],
            [ 'Value 1', 'Value 2', 'Value 3', 'Value 4' ],
            [ { text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4' ]
          ]
        }
      },

      'Bulleted list example:',
      {
        // to treat a paragraph as a bulleted list, set an array of items under the ul key
        ul: [
          'Item 1',
          'Item 2',
          'Item 3',
          { text: 'Item 4', bold: true },
        ]
      },

      'Numbered list example:',
      {
        // for numbered lists set the ol key
        ol: [
          'Item 1',
          'Item 2',
          'Item 3'
        ]
      },

      /*
      {
        // under NodeJS (or in case you use virtual file system provided by pdfmake)
        // you can also pass file names here
        image: 'images/test-rice1.jpg'
      },
      */

      {
        //or use an image defined in images
        image: 'rice_image',
        width: 100,
        height: 100
      },

      {
        //or use an image defined in images
        image: 'rice_image',
        width: 150,
        height: 70
      },

      'demo link',
      { text: 'google', link: 'http://google.com' },
      { text:'Go to page 2', linkToPage: 2 }
    ],
  };

};