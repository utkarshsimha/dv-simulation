c = []
n = 0

function DVNode(index) {
		this.index = index;
		this.r = {};
		this.d = [];
		this.nd = [];
	this.display = function() {
		console.log(this.index)
		console.log(this.d)
		console.log(this.nd)
		console.log(c[this.index])
	};
	this.dv_algo = function() {
		for( var it = 0; it < n; ++it )
		{
			if( it != this.index )
			{
				for( var jt = 0; jt < n; ++jt )
				{
					if( jt != this.index )
					{
						this.d[it] = Math.min( c[this.index][jt] + this.nd[jt][it], this.d[it] );
					}
				}
			}
		}
  };
}
function clientDV( n_links )
{
  var results = []
  var nodes = [];
	n = n_links.length;
	for( var it = 0; it < n; ++it )
	{
		nodes.push( new DVNode( it ) );
	}
	c = n_links
	for( var it = 0; it < n; ++it )
	{
		nodes[it].d = c[it];
		for( var jt = 0; jt < n; ++jt )
		{
			nodes[it].nd.push(c[jt]);
		}
		nodes[it].dv_algo();
		console.log(it+" : "+nodes[it].d);
    results.push(nodes[it].d);
	}
  return results;
}
