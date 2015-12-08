function DVSimulation()
{
  oThis = this;
  this.nodes = [];
  this.num_nodes = 0;
  this.all_links = []
  this.glob_links = null;
  this.createNodes = function()
  {
    //Reset existing state, if any
    $("#network").html("");
    this.all_links = [];
    this.nodes = [];

    var num_nodes = prompt("Enter number of nodes");
    this.num_nodes = num_nodes;
    this.glob_links = this.generateLinks( num_nodes );
    for( var it = 0; it < num_nodes; ++it )
    {
      //Generate links randomly
      var links = this.glob_links[it];
      links[it] = 0;
      console.log( links );
      this.all_links.push(links);

      //Create Nodes
      var node = new Node( it+"", "node"+it, links );
      oThis.nodes.push( node );
    }
    //Once the animation for positioning the nodes has stopped,
    //add the links between the nodes
    $(":animated").promise().done(function() {
      console.log( "Done creating nodes" );
      oThis.addLinks();
    });
  };

  this.addLinks = function()
  {
    //Get the link costs between each of the nodes
    //And draw a line between them
    for( var it = 0; it < this.num_nodes; ++it )
    {
      var nodes = this.nodes;
      var links = nodes[it].links;
      for( var jt = 0; jt < this.num_nodes; ++jt )
      {
        if( links[jt] != 0 )
        {
          var src_x = nodes[it].centerX;
          var src_y = nodes[it].centerY;
          var targ_x = nodes[jt].centerX;
          var targ_y = nodes[jt].centerY;
          //Using the line plugin for jQuery
          //Draw a line between source and target
          $("#network").line( src_x, src_y, targ_x, targ_y );
        }
      }
    }
  };
  this.gArr = new Array();
  this.generateLinks = function( from )
  {
    //Generate the links randomly within a range
    //(We don't want the nodes to exceed the screen)
    var links = new Array();
    for( var it = 0; it < this.num_nodes; ++it )
    {
      var i_links = new Array();
      for( var jt = 0; jt < this.num_nodes; ++jt )
      {
        randn =  getRandomInt( 0, 15 );
        if( randn > 10 )
        {
          randn = 0;
        }
        i_links.push( randn );
      }
      links.push( i_links );
    }
    for( var it = 0; it < this.num_nodes; ++it )
    {
      for( var jt = 0; jt < this.num_nodes; ++jt )
      {
        links[it][jt] = links[jt][it];
      }
    }
    return links;
  };

  this.simulateDV = function()
  {
    //Simulate DV algorithm
    var nodes = this.nodes;
    for( var it = 0; it < this.num_nodes; ++it )
    {
      var links = nodes[it].links;
      for( var jt = 0; jt < this.num_nodes; ++jt )
      {
        //For every existing link
        //(Self loops are taken care by setting them to 0)
        if(  links[jt] > 0  )
        {
          //Send the DV table from source table to target table
          //setTimeout( oThis.sendTable , 1000, oThis.nodes[it], oThis.nodes[jt] );
          this.sendTable( this.nodes[it], this.nodes[jt] );
        }
      }
    }
    //Once the animation for the sending of tables is completed,
    //Call the actual DV algorithm for updation of the tables
    $(":animated").promise().done( function() {
      console.log( "Done sending all tables" );
      updates = clientDV( oThis.all_links );
      oThis.updateTables( updates );
    });
  };

  this.sendTable = function( src, target )
  {
    //Get the table
    var table = src.dv_table;

    //Clone it
    var table_cpy = table.cloneNode(true);
    src.outer_div.appendChild( table_cpy );
    var jTable = $(table_cpy);
    //Set properties on the table
    table_cpy.style.display = "block";
    var src_left = $("#"+src.id).css('left');
    var src_top = $("#"+src.id).css('top');
    /* We need to change the position to fixed.
    Else it will move relative to its ancestor or parent */
    jTable.css({'position':'fixed'});
    jTable.css({'left':src_left,'top':src_top});

    //Get target co-ordinates to send the table to
    var targ_left = $("#"+target.id).css("left");
    var targ_top = $("#"+target.id).css("top");

    //Animate the sending of the table
    jTable.animate({'left':targ_left, 'top':targ_top}, 5000, function() {
      //Callback when node has arrived
      var jThis = $(this); //Convert into jQuery object
      //Fade it out
      jThis.fadeOut( 500, function() {
        //Callback for when the fade out has completed
        //var parent = this.parentNode;
        //Let it die in the arms of its parent! Muhahaha!
        this.parentNode.removeChild(this);
      });
    });
  };

  this.updateTables = function( updates )
  {
    for( var it = 0; it < this.num_nodes; ++it )
    {
      for( var jt = 0; jt < this.num_nodes; ++jt )
      {
        //Update the links
        //Javascript uses pass-by-reference for the arrays (Atleast, I'm hoping so!)
        this.all_links[it][jt] = updates[it][jt];
      }
    }
    // The most complex block I've written :P
    // I took quite a while to indent it!
    $("div.dv_table").fadeIn( 1000, function() {
        id = setTimeout( function() {
           $("div.dv_table").fadeOut(1000,function() {
             console.log("Displayed tables.")
             clearTimeout( id );
           });
        }, 6000 );
    });
  };
}

function Node( id, label, links )
{
  //Implementation for a Node
  nodeThis = this;
  this.id = id;
  this.label = label;
  this.links = links;
  this.show_dv_table = false;

  // Outer div
  this.outer_div = document.createElement("div");
  this.outer_div.setAttribute("id",id);
  this.outer_div.className = "outer_div";
  this.outer_div.onclick = function( event ) {
    event.stopPropagation();
    console.log("Click!");
    var node = event.target;
    var id = event.target.getAttribute("id");
    var disp = $("#"+id+" .dv_table").css("display");
    if( disp === "none" )
    {
      $("#"+id+" .dv_table").css({'display':'block'});
    }
    else
    {
      $("#"+id+" .dv_table").css({'display':'none'});
    }
  };

  //Distance Vector table
  this.dv_table = createTable( links );
  this.outer_div.appendChild( this.dv_table );

  //Append div to network div
  this.nw_div = document.getElementById('network');
  this.nw_div.appendChild( this.outer_div );

  //Move div to random position
  var l_randn = getRandomInt( 100, 1000 )+"px";
  var t_randn = getRandomInt( 0, 500 )+"px";
  $("#"+id).animate({'left':l_randn, 'top':t_randn});
  this.outer_div.style.left = l_randn;
  this.outer_div.style.top = t_randn;

  //Get the center of the div
  var offset = $("#"+id).offset();
  var width = $("#"+id).width();
  var height = $("#"+id).height();
  this.centerX = offset.left + (width / 2);
  this.centerY = offset.top + (height / 2);

}

function getRandomInt( min, max )
{
  //Generate random integeres within a range
  return Math.floor( Math.random()*(max-min+1) ) + min ;
}

function createTable( links )
{
  //Create a Distance Vector table
  var enclosing_div = document.createElement("div");
  enclosing_div.className = "dv_table"; //For CSS properties
  var table = document.createElement("table");
  table.setAttribute("border","1px");
  table.setAttribute("cellpadding","2px");
  for( var it = 0; it < links.length; ++it )
  {
    var tr = document.createElement("tr");
    var td_idx = document.createElement("td");
    var td_val = document.createElement("td");
    //The first column is the index of the Node
    //The second column is the link cost to the node
    td_idx.innerHTML = it;
    td_val.innerHTML = links[it];
    tr.appendChild(td_idx);
    tr.appendChild(td_val);
    table.appendChild(tr);
  }
  enclosing_div.appendChild(table);
  return enclosing_div;
}

obj = new DVSimulation();
